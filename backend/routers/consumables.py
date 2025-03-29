# backend/routers/consumables.py
# ------------------------------
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import crud, schemas, database

router = APIRouter(
    prefix="/consumables",
    tags=["consumables"]
)

@router.post("/", response_model=schemas.Consumable)
def create_consumable(consumable: schemas.ConsumableCreate, db: Session = Depends(database.get_db)):
    return crud.create_consumable(db=db, consumable=consumable)

@router.get("/", response_model=list[schemas.Consumable])
def read_consumables(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    return crud.get_consumables(db, skip=skip, limit=limit)

@router.get("/{consumable_id}", response_model=schemas.Consumable)
def read_consumable(consumable_id: int, db: Session = Depends(database.get_db)):
    db_item = crud.get_consumable(db, consumable_id=consumable_id)
    if db_item is None:
        raise HTTPException(status_code=404, detail="Consumable not found")
    return db_item