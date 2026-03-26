# backend/routers/contacts.py
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from .. import crud, schemas, database
from ..auth import get_current_account

router = APIRouter(prefix="/contacts", tags=["contacts"])


# ── Providers ─────────────────────────────────────────────────────────────────

@router.get("/providers", response_model=List[schemas.ProviderResponse])
def list_providers(
    db: Session = Depends(database.get_db),
    account=Depends(get_current_account),
):
    return crud.get_providers(db, account.id)


@router.get("/providers/search", response_model=List[schemas.ProviderResponse])
def search_providers(
    q: Optional[str] = Query(None),
    db: Session = Depends(database.get_db),
    account=Depends(get_current_account),
):
    return crud.search_providers(db, account.id, q)


@router.post("/providers", response_model=schemas.ProviderResponse, status_code=201)
def create_provider(
    payload: schemas.ProviderCreate,
    db: Session = Depends(database.get_db),
    account=Depends(get_current_account),
):
    return crud.create_provider(db, account.id, payload)


@router.patch("/providers/{provider_id}", response_model=schemas.ProviderResponse)
def update_provider(
    provider_id: int,
    payload: schemas.ProviderUpdate,
    db: Session = Depends(database.get_db),
    account=Depends(get_current_account),
):
    provider = crud.update_provider(db, provider_id, account.id, payload)
    if provider is None:
        raise HTTPException(status_code=404, detail="Provider not found")
    return provider


@router.delete("/providers/{provider_id}", status_code=204)
def delete_provider(
    provider_id: int,
    db: Session = Depends(database.get_db),
    account=Depends(get_current_account),
):
    if crud.delete_provider(db, provider_id, account.id) is None:
        raise HTTPException(status_code=404, detail="Provider not found")


# ── Pharmacies ────────────────────────────────────────────────────────────────

@router.get("/pharmacies", response_model=List[schemas.PharmacyResponse])
def list_pharmacies(
    db: Session = Depends(database.get_db),
    account=Depends(get_current_account),
):
    return crud.get_pharmacies(db, account.id)


@router.get("/pharmacies/search", response_model=List[schemas.PharmacyResponse])
def search_pharmacies(
    q: Optional[str] = Query(None),
    db: Session = Depends(database.get_db),
    account=Depends(get_current_account),
):
    return crud.search_pharmacies(db, account.id, q)


@router.post("/pharmacies", response_model=schemas.PharmacyResponse, status_code=201)
def create_pharmacy(
    payload: schemas.PharmacyCreate,
    db: Session = Depends(database.get_db),
    account=Depends(get_current_account),
):
    return crud.create_pharmacy(db, account.id, payload)


@router.patch("/pharmacies/{pharmacy_id}", response_model=schemas.PharmacyResponse)
def update_pharmacy(
    pharmacy_id: int,
    payload: schemas.PharmacyUpdate,
    db: Session = Depends(database.get_db),
    account=Depends(get_current_account),
):
    pharmacy = crud.update_pharmacy(db, pharmacy_id, account.id, payload)
    if pharmacy is None:
        raise HTTPException(status_code=404, detail="Pharmacy not found")
    return pharmacy


@router.delete("/pharmacies/{pharmacy_id}", status_code=204)
def delete_pharmacy(
    pharmacy_id: int,
    db: Session = Depends(database.get_db),
    account=Depends(get_current_account),
):
    if crud.delete_pharmacy(db, pharmacy_id, account.id) is None:
        raise HTTPException(status_code=404, detail="Pharmacy not found")
