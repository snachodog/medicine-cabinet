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

import os
import secrets
import logging

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from .. import crud, database
from ..auth import ACCESS_TOKEN_EXPIRE_MINUTES, create_access_token

logger = logging.getLogger(__name__)

OIDC_ISSUER        = os.getenv("OIDC_ISSUER", "").rstrip("/")
OIDC_CLIENT_ID     = os.getenv("OIDC_CLIENT_ID", "")
OIDC_CLIENT_SECRET = os.getenv("OIDC_CLIENT_SECRET", "")
OIDC_SCOPES        = os.getenv("OIDC_SCOPES", "openid email profile")
OIDC_CONFIGURED    = bool(OIDC_ISSUER and OIDC_CLIENT_ID and OIDC_CLIENT_SECRET)

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
    # Build the callback URL from the incoming request's base URL so it works
    # behind a reverse proxy without hardcoding a hostname in env.
    base = str(request.base_url).rstrip("/")
    return f"{base}/api/auth/oidc/callback"


@router.get("/login")
async def oidc_login(request: Request):
    if not OIDC_CONFIGURED:
        raise HTTPException(status_code=501, detail="OIDC is not configured")

    config = await _discover()
    state = secrets.token_urlsafe(32)
    params = (
        f"?response_type=code"
        f"&client_id={OIDC_CLIENT_ID}"
        f"&redirect_uri={_redirect_uri(request)}"
        f"&scope={OIDC_SCOPES.replace(' ', '+')}"
        f"&state={state}"
    )
    auth_url = config["authorization_endpoint"] + params

    response = RedirectResponse(auth_url, status_code=302)
    response.set_cookie(
        "oidc_state", state,
        httponly=True, max_age=300, samesite="lax",
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

    email: str = userinfo.get("email") or ""
    sub: str   = userinfo.get("sub") or ""

    if not email and not sub:
        raise HTTPException(status_code=400, detail="Provider did not return email or sub claim")

    # Find existing account by email, then fall back to creating one
    account = crud.get_account_by_email(db, email) if email else None

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
        account = crud.create_account(db, username, dummy_hash, email=email or None)
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
    )
    response.delete_cookie("oidc_state")
    return response
