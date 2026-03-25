# backend/routers/auth.py
# -----------------------
# Authentication endpoints: register, login, me

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from .. import crud, schemas, database
from ..auth import hash_password, verify_password, create_access_token, get_current_account

router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)


@router.post("/register", response_model=schemas.AccountResponse, status_code=201)
def register(payload: schemas.AccountCreate, db: Session = Depends(database.get_db)):
    if crud.get_account_by_username(db, payload.username):
        raise HTTPException(status_code=400, detail="Username already registered")
    account = crud.create_account(db, payload.username, hash_password(payload.password))
    return account


@router.post("/login", response_model=schemas.Token)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    account = crud.get_account_by_username(db, form.username)
    if not account or not verify_password(form.password, account.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token({"sub": account.username})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=schemas.AccountResponse)
def me(account=Depends(get_current_account)):
    return account
