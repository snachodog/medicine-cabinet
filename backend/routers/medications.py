# backend/routers/medications.py
# ------------------------------
# TODO: Add barcode scanning support. Add a GET /medications/barcode/{upc} endpoint
# that looks up drug info by UPC/NDC from an external API (e.g. Open FDA) and returns
# a pre-filled medication payload for the frontend to confirm before saving.
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import crud, schemas, database
from ..auth import get_current_account

router = APIRouter(
    prefix="/medications",
    tags=["medications"]
)

@router.post("/", response_model=schemas.Medication)
def create_medication(
    medication: schemas.MedicationCreate,
    db: Session = Depends(database.get_db),
    _account=Depends(get_current_account),
):
    return crud.create_medication(db=db, medication=medication)

@router.get("/", response_model=list[schemas.Medication])
def read_medications(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    db: Session = Depends(database.get_db),
    _account=Depends(get_current_account),
):
    return crud.get_medications(db, skip=skip, limit=limit, search=search)

@router.get("/{medication_id}", response_model=schemas.Medication)
def read_medication(
    medication_id: int,
    db: Session = Depends(database.get_db),
    _account=Depends(get_current_account),
):
    db_med = crud.get_medication(db, medication_id=medication_id)
    if db_med is None:
        raise HTTPException(status_code=404, detail="Medication not found")
    return db_med

@router.put("/{medication_id}", response_model=schemas.Medication)
def update_medication(
    medication_id: int,
    medication: schemas.MedicationUpdate,
    db: Session = Depends(database.get_db),
    _account=Depends(get_current_account),
):
    db_med = crud.update_medication(db, medication_id=medication_id, medication=medication)
    if db_med is None:
        raise HTTPException(status_code=404, detail="Medication not found")
    return db_med

@router.delete("/{medication_id}", response_model=schemas.Medication)
def delete_medication(
    medication_id: int,
    db: Session = Depends(database.get_db),
    _account=Depends(get_current_account),
):
    db_med = crud.delete_medication(db, medication_id=medication_id)
    if db_med is None:
        raise HTTPException(status_code=404, detail="Medication not found")
    return db_med
