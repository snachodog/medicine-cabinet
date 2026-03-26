# backend/routers/auth.py
# -----------------------
# Authentication endpoints: register, login, logout, me

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

router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)


@router.post("/register", response_model=schemas.AccountResponse, status_code=201)
@limiter.limit("5/minute")
def register(request: Request, payload: schemas.AccountCreate, db: Session = Depends(database.get_db)):
    if crud.get_account_by_username(db, payload.username):
        raise HTTPException(status_code=400, detail="Username already registered")
    account = crud.create_account(db, payload.username, hash_password(payload.password))
    return account


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
