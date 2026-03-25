# backend/routers/medications.py
# ------------------------------
# TODO: Add a search query parameter to GET /medications. Accept an optional ?search=
# string and filter results by name, brand_name, and category using SQLAlchemy ilike.
# Update crud.get_medications to accept the search parameter.
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import crud, schemas, database

router = APIRouter(
    prefix="/medications",
    tags=["medications"]
)

@router.post("/", response_model=schemas.Medication)
def create_medication(medication: schemas.MedicationCreate, db: Session = Depends(database.get_db)):
    return crud.create_medication(db=db, medication=medication)

@router.get("/", response_model=list[schemas.Medication])
def read_medications(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    return crud.get_medications(db, skip=skip, limit=limit)

@router.get("/{medication_id}", response_model=schemas.Medication)
def read_medication(medication_id: int, db: Session = Depends(database.get_db)):
    db_med = crud.get_medication(db, medication_id=medication_id)
    if db_med is None:
        raise HTTPException(status_code=404, detail="Medication not found")
    return db_med

@router.put("/{medication_id}", response_model=schemas.Medication)
def update_medication(
    medication_id: int, medication: schemas.MedicationUpdate, db: Session = Depends(database.get_db)
):
    db_med = crud.update_medication(db, medication_id=medication_id, medication=medication)
    if db_med is None:
        raise HTTPException(status_code=404, detail="Medication not found")
    return db_med

@router.delete("/{medication_id}", response_model=schemas.Medication)
def delete_medication(medication_id: int, db: Session = Depends(database.get_db)):
    db_med = crud.delete_medication(db, medication_id=medication_id)
    if db_med is None:
        raise HTTPException(status_code=404, detail="Medication not found")
    return db_med
