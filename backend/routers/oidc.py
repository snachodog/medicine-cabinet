# backend/routers/oidc.py
# -----------------------
# OIDC / OAuth2 authorization-code login.
#
# Required env vars (all must be set to enable OIDC):
#   OIDC_ISSUER          — e.g. https://accounts.google.com  or  https://your-keycloak/realms/myrealm
#   OIDC_CLIENT_ID       — client ID registered with the provider
#   OIDC_CLIENT_SECRET   — client secret
#
# Optional:
#   OIDC_PROVIDER_NAME   — display name shown on the login button (default: "SSO")
#   OIDC_SCOPES          — space-separated scopes (default: "openid email profile")
#   OIDC_REDIRECT_URI    - full callback URL, e.g. https://meds.example.com/api/auth/oidc/callback
#                          (default: derived from the request / X-Forwarded-* headers)

import os
import secrets
import logging
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from .. import crud, database
from ..auth import ACCESS_TOKEN_EXPIRE_MINUTES, create_access_token

logger = logging.getLogger(__name__)

_raw_issuer = os.getenv("OIDC_ISSUER", "").strip().rstrip("/")
# Normalize: add https:// if the value looks like a bare hostname/path
if _raw_issuer and not _raw_issuer.startswith(("http://", "https://")):
    _raw_issuer = "https://" + _raw_issuer
OIDC_ISSUER        = _raw_issuer
OIDC_CLIENT_ID     = os.getenv("OIDC_CLIENT_ID", "")
OIDC_CLIENT_SECRET = os.getenv("OIDC_CLIENT_SECRET", "")
OIDC_SCOPES        = os.getenv("OIDC_SCOPES", "openid email profile")
OIDC_REDIRECT_URI  = os.getenv("OIDC_REDIRECT_URI", "").strip()
OIDC_CONFIGURED    = bool(OIDC_ISSUER and OIDC_CLIENT_ID and OIDC_CLIENT_SECRET)
COOKIE_SECURE      = os.getenv("COOKIE_SECURE", "true").lower() == "true"

router = APIRouter(prefix="/auth/oidc", tags=["oidc"])

_discovery_cache: dict = {}


async def _discover() -> dict:
    """Fetch and cache the OIDC provider's discovery document."""
    if _discovery_cache:
        return _discovery_cache
    url = f"{OIDC_ISSUER}/.well-known/openid-configuration"
    async with httpx.AsyncClient() as client:
        r = await client.get(url, timeout=10)
        r.raise_for_status()
    _discovery_cache.update(r.json())
    return _discovery_cache


def _redirect_uri(request: Request) -> str:
    if OIDC_REDIRECT_URI:
        return OIDC_REDIRECT_URI
    # Build the callback URL from the incoming request so it works behind a
    # reverse proxy without hardcoding a hostname in env. Uvicorn only trusts
    # X-Forwarded-* from localhost, so a TLS-terminating proxy on another host
    # would otherwise yield http:// and fail the provider's exact-match check.
    # Trusting these headers here is safe: the provider rejects any redirect
    # URI that is not registered for the client.
    proto = request.headers.get("x-forwarded-proto", request.url.scheme).split(",")[0].strip()
    host = request.headers.get("x-forwarded-host", request.url.netloc).split(",")[0].strip()
    return f"{proto}://{host}/api/auth/oidc/callback"


@router.get("/login")
async def oidc_login(request: Request):
    if not OIDC_CONFIGURED:
        raise HTTPException(status_code=501, detail="OIDC is not configured")

    config = await _discover()
    state = secrets.token_urlsafe(32)
    redirect_uri = _redirect_uri(request)
    logger.info("Starting OIDC login with redirect_uri=%s", redirect_uri)
    params = urlencode({
        "response_type": "code",
        "client_id": OIDC_CLIENT_ID,
        "redirect_uri": redirect_uri,
        "scope": OIDC_SCOPES,
        "state": state,
    })
    auth_url = f"{config['authorization_endpoint']}?{params}"

    response = RedirectResponse(auth_url, status_code=302)
    response.set_cookie(
        "oidc_state", state,
        httponly=True, max_age=300, samesite="lax", secure=COOKIE_SECURE,
    )
    return response


@router.get("/callback")
async def oidc_callback(
    request: Request,
    code: str = None,
    state: str = None,
    error: str = None,
    db: Session = Depends(database.get_db),
):
    if error:
        logger.warning("OIDC provider returned error: %s", error)
        return RedirectResponse("/login?error=oidc_denied", status_code=302)

    if not code or not state:
        raise HTTPException(status_code=400, detail="Missing code or state")

    stored_state = request.cookies.get("oidc_state")
    if not stored_state or stored_state != state:
        raise HTTPException(status_code=400, detail="Invalid or expired state")

    config = await _discover()

    async with httpx.AsyncClient() as client:
        # Exchange authorization code for tokens
        token_r = await client.post(
            config["token_endpoint"],
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": _redirect_uri(request),
                "client_id": OIDC_CLIENT_ID,
                "client_secret": OIDC_CLIENT_SECRET,
            },
            timeout=10,
        )
        if token_r.status_code != 200:
            logger.error("Token exchange failed: %s", token_r.text)
            raise HTTPException(status_code=502, detail="Token exchange failed")
        tokens = token_r.json()

        # Fetch userinfo
        userinfo_r = await client.get(
            config["userinfo_endpoint"],
            headers={"Authorization": f"Bearer {tokens['access_token']}"},
            timeout=10,
        )
        if userinfo_r.status_code != 200:
            raise HTTPException(status_code=502, detail="Userinfo fetch failed")
        userinfo = userinfo_r.json()

    email: str = (userinfo.get("email") or "").strip()
    sub: str   = str(userinfo.get("sub") or "")
    # Only a literal true counts. Some providers omit the claim or send "false".
    email_verified = userinfo.get("email_verified") is True

    if not sub:
        raise HTTPException(status_code=400, detail="Provider did not return a sub claim")

    # 1. Returning SSO user: match on the stable issuer + sub identity.
    account = crud.get_account_by_oidc(db, OIDC_ISSUER, sub)

    # 2. First SSO login for an existing account: link by email, but only when
    #    the provider says the address is verified. Otherwise anyone who can
    #    register an unverified address at the provider could take over the
    #    matching account here.
    if account is None and email:
        matches = [a for a in crud.get_accounts_by_email(db, email) if not a.oidc_subject]
        if matches:
            if not email_verified:
                logger.warning(
                    "OIDC login refused: email %s matches an existing account but the "
                    "provider did not mark it verified (sub=%s)", email, sub,
                )
                return RedirectResponse("/login?error=oidc_email_unverified", status_code=302)
            if len(matches) > 1:
                logger.warning(
                    "OIDC login refused: email %s matches %d accounts (sub=%s)",
                    email, len(matches), sub,
                )
                return RedirectResponse("/login?error=oidc_email_ambiguous", status_code=302)
            account = matches[0]
            account.oidc_issuer = OIDC_ISSUER
            account.oidc_subject = sub
            db.commit()
            logger.info("Linked account '%s' to OIDC identity (sub=%s)", account.username, sub)

    # 3. New user: create an account tied to this identity.
    if account is None:
        # Derive a username from the email prefix or the sub claim
        base = (email.split("@")[0] if email else sub)[:48]
        username = base
        suffix = 2
        while crud.get_account_by_username(db, username):
            username = f"{base}{suffix}"
            suffix += 1

        # Account created via OIDC has no usable password — store a random hash
        import bcrypt as _bcrypt
        dummy_hash = _bcrypt.hashpw(secrets.token_bytes(32), _bcrypt.gensalt()).decode()
        account = crud.create_account(
            db, username, dummy_hash,
            email=email if email_verified else None,
            oidc_issuer=OIDC_ISSUER,
            oidc_subject=sub,
        )
        logger.info("Auto-created account '%s' via OIDC (sub=%s)", username, sub)

    if not account.is_active:
        return RedirectResponse("/login?error=account_disabled", status_code=302)

    token = create_access_token({"sub": account.username})
    response = RedirectResponse("/", status_code=302)
    response.set_cookie(
        key="mc_token",
        value=token,
        httponly=True,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        secure=COOKIE_SECURE,
    )
    response.delete_cookie("oidc_state")
    return response
