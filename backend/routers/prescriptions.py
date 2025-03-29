# backend/routers/prescriptions.py
# --------------------------------
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import crud, schemas, database

router = APIRouter(
    prefix="/prescriptions",
    tags=["prescriptions"]
)

@router.post("/", response_model=schemas.Prescription)
def create_prescription(prescription: schemas.PrescriptionCreate, db: Session = Depends(database.get_db)):
    return crud.create_prescription(db=db, prescription=prescription)

@router.get("/", response_model=list[schemas.Prescription])
def read_prescriptions(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    return crud.get_prescriptions(db, skip=skip, limit=limit)

@router.get("/{prescription_id}", response_model=schemas.Prescription)
def read_prescription(prescription_id: int, db: Session = Depends(database.get_db)):
    db_rx = crud.get_prescription(db, prescription_id=prescription_id)
    if db_rx is None:
        raise HTTPException(status_code=404, detail="Prescription not found")
    return db_rx
