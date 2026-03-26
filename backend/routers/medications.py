# backend/routers/medications.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .. import crud, schemas, database
from ..auth import get_current_account

router = APIRouter(prefix="/medications", tags=["medications"])


@router.post("", response_model=schemas.MedicationResponse, status_code=201)
def create_medication(
    payload: schemas.MedicationCreate,
    db: Session = Depends(database.get_db),
    account=Depends(get_current_account),
):
    _require_access(db, account.id, payload.person_id)
    return crud.create_medication(db, payload)


@router.get("/person/{person_id}", response_model=List[schemas.MedicationResponse])
def list_medications(
    person_id: int,
    active_only: bool = True,
    db: Session = Depends(database.get_db),
    account=Depends(get_current_account),
):
    _require_access(db, account.id, person_id)
    return crud.get_medications_for_person(db, person_id, active_only=active_only)


@router.get("/{medication_id}", response_model=schemas.MedicationResponse)
def get_medication(
    medication_id: int,
    db: Session = Depends(database.get_db),
    account=Depends(get_current_account),
):
    med = _get_or_404(db, medication_id)
    _require_access(db, account.id, med.person_id)
    return med


@router.patch("/{medication_id}", response_model=schemas.MedicationResponse)
def update_medication(
    medication_id: int,
    payload: schemas.MedicationUpdate,
    db: Session = Depends(database.get_db),
    account=Depends(get_current_account),
):
    med = _get_or_404(db, medication_id)
    _require_access(db, account.id, med.person_id)
    return crud.update_medication(db, medication_id, payload)


@router.delete("/{medication_id}", status_code=204)
def delete_medication(
    medication_id: int,
    db: Session = Depends(database.get_db),
    account=Depends(get_current_account),
):
    med = _get_or_404(db, medication_id)
    _require_access(db, account.id, med.person_id)
    crud.delete_medication(db, medication_id)


def _get_or_404(db, medication_id: int):
    med = crud.get_medication(db, medication_id)
    if med is None:
        raise HTTPException(status_code=404, detail="Medication not found")
    return med

def _require_access(db, account_id: int, person_id: int):
    if not crud.account_can_access_person(db, account_id, person_id):
        raise HTTPException(status_code=403, detail="Access denied")
