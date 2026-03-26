# backend/routers/dose_logs.py
from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from .. import crud, schemas, database
from ..auth import get_current_account

router = APIRouter(prefix="/dose-logs", tags=["dose-logs"])


@router.post("", response_model=schemas.DoseLogResponse, status_code=201)
def log_dose(
    payload: schemas.DoseLogCreate,
    db: Session = Depends(database.get_db),
    account=Depends(get_current_account),
):
    if not crud.account_can_access_person(db, account.id, payload.person_id):
        raise HTTPException(status_code=403, detail="Access denied")
    med = crud.get_medication(db, payload.medication_id)
    if med is None:
        raise HTTPException(status_code=404, detail="Medication not found")
    if med.person_id != payload.person_id:
        raise HTTPException(status_code=400, detail="Medication does not belong to this person")
    return crud.log_dose(db, payload, account.id)


@router.get("/person/{person_id}", response_model=List[schemas.DoseLogResponse])
def list_dose_logs(
    person_id: int,
    medication_id: Optional[int] = Query(None),
    since: Optional[date] = Query(None),
    limit: int = Query(100, le=500),
    db: Session = Depends(database.get_db),
    account=Depends(get_current_account),
):
    if not crud.account_can_access_person(db, account.id, person_id):
        raise HTTPException(status_code=403, detail="Access denied")
    return crud.get_dose_logs(db, person_id, medication_id=medication_id, since=since, limit=limit)


@router.get("/streak/{person_id}/{medication_id}")
def get_streak(
    person_id: int,
    medication_id: int,
    db: Session = Depends(database.get_db),
    account=Depends(get_current_account),
):
    if not crud.account_can_access_person(db, account.id, person_id):
        raise HTTPException(status_code=403, detail="Access denied")
    return {"streak": crud.get_streak(db, person_id, medication_id)}


@router.delete("/{dose_log_id}", status_code=204)
def delete_dose_log(
    dose_log_id: int,
    db: Session = Depends(database.get_db),
    account=Depends(get_current_account),
):
    entry = crud.get_dose_log(db, dose_log_id)
    if entry is None:
        raise HTTPException(status_code=404, detail="Dose log not found")
    if not crud.account_can_access_person(db, account.id, entry.person_id):
        raise HTTPException(status_code=403, detail="Access denied")
    crud.delete_dose_log(db, dose_log_id)
