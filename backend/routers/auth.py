# backend/routers/auth.py
# -----------------------
# Authentication endpoints: register, login, logout, me, config, invites

import os
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from .. import crud, schemas, database
from ..auth import (
    ACCESS_TOKEN_EXPIRE_MINUTES, ALGORITHM, SECRET_KEY,
    hash_password, verify_password, create_access_token,
    get_current_account, revoke_token,
)
from ..limiter import limiter

REGISTRATION_ENABLED = os.getenv("REGISTRATION_ENABLED", "true").lower() == "true"

router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)


@router.get("/config")
def get_config():
    """Public endpoint — lets the frontend adapt its UI to server configuration."""
    from .oidc import OIDC_CONFIGURED
    return {
        "registration_enabled": REGISTRATION_ENABLED,
        "oidc_enabled": OIDC_CONFIGURED,
        "oidc_provider_name": os.getenv("OIDC_PROVIDER_NAME", "SSO"),
    }


def _validate_invite(db: Session, code: str):
    """Return invite if valid; raise HTTPException otherwise."""
    invite = crud.get_invite_by_code(db, code)
    if invite is None:
        raise HTTPException(status_code=400, detail="Invalid invite code")
    if invite.used_at is not None:
        raise HTTPException(status_code=400, detail="Invite code has already been used")
    if invite.expires_at and invite.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invite code has expired")
    return invite


@router.post("/register", response_model=schemas.AccountResponse, status_code=201)
@limiter.limit("5/minute")
def register(request: Request, payload: schemas.AccountCreate, db: Session = Depends(database.get_db)):
    invite = None
    if not REGISTRATION_ENABLED:
        if not payload.invite_code:
            raise HTTPException(status_code=403, detail="Registration requires an invite code")
        invite = _validate_invite(db, payload.invite_code)
    elif payload.invite_code:
        # Registration is open but a code was supplied — validate it anyway
        invite = _validate_invite(db, payload.invite_code)

    if crud.get_account_by_username(db, payload.username):
        raise HTTPException(status_code=400, detail="Username already registered")

    account = crud.create_account(db, payload.username, hash_password(payload.password))

    if invite:
        crud.consume_invite(db, invite, account.id)

    return account


# ── Invite management (requires authentication) ────────────────────────────────

@router.post("/invites", response_model=schemas.InviteCodeResponse, status_code=201)
def create_invite(
    payload: schemas.InviteCodeCreate,
    db: Session = Depends(database.get_db),
    account=Depends(get_current_account),
):
    return crud.create_invite_code(db, account.id, payload.expires_in_days)


@router.get("/invites", response_model=List[schemas.InviteCodeResponse])
def list_invites(
    db: Session = Depends(database.get_db),
    account=Depends(get_current_account),
):
    invites = crud.get_invite_codes_for_account(db, account.id)
    result = []
    for inv in invites:
        result.append(schemas.InviteCodeResponse(
            id=inv.id,
            code=inv.code,
            created_at=inv.created_at,
            expires_at=inv.expires_at,
            used_at=inv.used_at,
            used_by_username=inv.used_by.username if inv.used_by else None,
        ))
    return result


@router.delete("/invites/{invite_id}", status_code=204)
def revoke_invite(
    invite_id: int,
    db: Session = Depends(database.get_db),
    account=Depends(get_current_account),
):
    if not crud.revoke_invite(db, invite_id, account.id):
        raise HTTPException(status_code=404, detail="Invite not found or already used")


@router.post("/login", response_model=schemas.AccountResponse)
@limiter.limit("10/minute")
def login(
    request: Request,
    response: Response,
    form: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(database.get_db),
):
    account = crud.get_account_by_username(db, form.username)
    if not account or not verify_password(form.password, account.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    token = create_access_token({"sub": account.username})
    response.set_cookie(
        key="mc_token",
        value=token,
        httponly=True,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        # secure=True  # Uncomment when serving over HTTPS in production
    )
    return account


@router.post("/logout", status_code=204)
def logout(request: Request, response: Response):
    token = request.cookies.get("mc_token")
    if token:
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            jti = payload.get("jti")
            if jti:
                revoke_token(jti)
        except JWTError:
            pass
    response.delete_cookie("mc_token", samesite="lax")


@router.get("/me", response_model=schemas.AccountResponse)
def me(account=Depends(get_current_account)):
    return account


@router.patch("/me", response_model=schemas.AccountResponse)
def update_me(
    payload: schemas.AccountUpdate,
    db: Session = Depends(database.get_db),
    account=Depends(get_current_account),
):
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(account, field, value)
    db.commit()
    db.refresh(account)
    return account
