# backend/routers/persons.py
# --------------------------
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import crud, schemas, database
from ..auth import get_current_account

router = APIRouter(
    prefix="/persons",
    tags=["persons"]
)

@router.post("/", response_model=schemas.Person)
def create_person(
    person: schemas.PersonCreate,
    db: Session = Depends(database.get_db),
    _account=Depends(get_current_account),
):
    return crud.create_person(db=db, person=person)

@router.get("/", response_model=list[schemas.Person])
def read_persons(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(database.get_db),
    _account=Depends(get_current_account),
):
    return crud.get_persons(db, skip=skip, limit=limit)

@router.get("/{person_id}", response_model=schemas.Person)
def read_person(
    person_id: int,
    db: Session = Depends(database.get_db),
    _account=Depends(get_current_account),
):
    db_person = crud.get_person(db, person_id=person_id)
    if db_person is None:
        raise HTTPException(status_code=404, detail="Person not found")
    return db_person

@router.put("/{person_id}", response_model=schemas.Person)
def update_person(
    person_id: int,
    person: schemas.PersonUpdate,
    db: Session = Depends(database.get_db),
    _account=Depends(get_current_account),
):
    db_person = crud.update_person(db, person_id=person_id, person=person)
    if db_person is None:
        raise HTTPException(status_code=404, detail="Person not found")
    return db_person

@router.delete("/{person_id}", response_model=schemas.Person)
def delete_person(
    person_id: int,
    db: Session = Depends(database.get_db),
    _account=Depends(get_current_account),
):
    db_person = crud.delete_person(db, person_id=person_id)
    if db_person is None:
        raise HTTPException(status_code=404, detail="Person not found")
    return db_person
