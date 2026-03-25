# backend/routers/consumables.py
# ------------------------------
# TODO: Add a GET /consumables/low-stock endpoint that returns consumables where
# quantity is at or below reorder_threshold. Add a corresponding crud function
# using a SQLAlchemy filter on Consumable.quantity <= Consumable.reorder_threshold.
from typing import Optional
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
def read_consumables(
    skip: int = 0, limit: int = 100, search: Optional[str] = None, db: Session = Depends(database.get_db)
):
    return crud.get_consumables(db, skip=skip, limit=limit, search=search)

@router.get("/{consumable_id}", response_model=schemas.Consumable)
def read_consumable(consumable_id: int, db: Session = Depends(database.get_db)):
    db_item = crud.get_consumable(db, consumable_id=consumable_id)
    if db_item is None:
        raise HTTPException(status_code=404, detail="Consumable not found")
    return db_item

@router.put("/{consumable_id}", response_model=schemas.Consumable)
def update_consumable(
    consumable_id: int, consumable: schemas.ConsumableUpdate, db: Session = Depends(database.get_db)
):
    db_item = crud.update_consumable(db, consumable_id=consumable_id, consumable=consumable)
    if db_item is None:
        raise HTTPException(status_code=404, detail="Consumable not found")
    return db_item

@router.delete("/{consumable_id}", response_model=schemas.Consumable)
def delete_consumable(consumable_id: int, db: Session = Depends(database.get_db)):
    db_item = crud.delete_consumable(db, consumable_id=consumable_id)
    if db_item is None:
        raise HTTPException(status_code=404, detail="Consumable not found")
    return db_item
