# backend/routers/prescriptions.py
# --------------------------------
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import crud, schemas, database
from ..auth import get_current_account

router = APIRouter(
    prefix="/prescriptions",
    tags=["prescriptions"]
)

@router.post("/", response_model=schemas.Prescription)
def create_prescription(
    prescription: schemas.PrescriptionCreate,
    db: Session = Depends(database.get_db),
    _account=Depends(get_current_account),
):
    return crud.create_prescription(db=db, prescription=prescription)

@router.get("/", response_model=list[schemas.Prescription])
def read_prescriptions(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(database.get_db),
    _account=Depends(get_current_account),
):
    return crud.get_prescriptions(db, skip=skip, limit=limit)

@router.get("/{prescription_id}", response_model=schemas.Prescription)
def read_prescription(
    prescription_id: int,
    db: Session = Depends(database.get_db),
    _account=Depends(get_current_account),
):
    db_rx = crud.get_prescription(db, prescription_id=prescription_id)
    if db_rx is None:
        raise HTTPException(status_code=404, detail="Prescription not found")
    return db_rx

@router.put("/{prescription_id}", response_model=schemas.Prescription)
def update_prescription(
    prescription_id: int,
    prescription: schemas.PrescriptionUpdate,
    db: Session = Depends(database.get_db),
    _account=Depends(get_current_account),
):
    db_rx = crud.update_prescription(
        db, prescription_id=prescription_id, prescription=prescription
    )
    if db_rx is None:
        raise HTTPException(status_code=404, detail="Prescription not found")
    return db_rx

@router.delete("/{prescription_id}", response_model=schemas.Prescription)
def delete_prescription(
    prescription_id: int,
    db: Session = Depends(database.get_db),
    _account=Depends(get_current_account),
):
    db_rx = crud.delete_prescription(db, prescription_id=prescription_id)
    if db_rx is None:
        raise HTTPException(status_code=404, detail="Prescription not found")
    return db_rx
