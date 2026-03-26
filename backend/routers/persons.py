# backend/routers/persons.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .. import crud, schemas, database
from ..auth import get_current_account

router = APIRouter(prefix="/persons", tags=["persons"])


@router.post("", response_model=schemas.PersonResponse, status_code=201)
def create_person(
    payload: schemas.PersonCreate,
    db: Session = Depends(database.get_db),
    account=Depends(get_current_account),
):
    person = crud.create_person(db, payload)
    crud.grant_access(db, account.id, person.id)
    crud.write_audit(db, "person", person.id, "create", account.id, f"Created person '{person.name}'")
    return person


@router.get("", response_model=List[schemas.PersonResponse])
def list_persons(
    db: Session = Depends(database.get_db),
    account=Depends(get_current_account),
):
    return crud.get_accessible_persons(db, account.id)


@router.get("/{person_id}", response_model=schemas.PersonResponse)
def get_person(
    person_id: int,
    db: Session = Depends(database.get_db),
    account=Depends(get_current_account),
):
    _require_access(db, account.id, person_id)
    person = crud.get_person(db, person_id)
    if person is None:
        raise HTTPException(status_code=404, detail="Person not found")
    return person


@router.patch("/{person_id}", response_model=schemas.PersonResponse)
def update_person(
    person_id: int,
    payload: schemas.PersonUpdate,
    db: Session = Depends(database.get_db),
    account=Depends(get_current_account),
):
    _require_access(db, account.id, person_id)
    person = crud.update_person(db, person_id, payload)
    if person is None:
        raise HTTPException(status_code=404, detail="Person not found")
    crud.write_audit(db, "person", person_id, "update", account.id, f"Updated person '{person.name}'")
    return person


@router.delete("/{person_id}", status_code=204)
def delete_person(
    person_id: int,
    db: Session = Depends(database.get_db),
    account=Depends(get_current_account),
):
    _require_access(db, account.id, person_id)
    deleted = crud.delete_person(db, person_id)
    if deleted is None:
        raise HTTPException(status_code=404, detail="Person not found")
    crud.write_audit(db, "person", person_id, "delete", account.id, f"Deleted person '{deleted.name}'")


@router.get("/{person_id}/access", response_model=List[schemas.AccessEntry])
def list_access(
    person_id: int,
    db: Session = Depends(database.get_db),
    account=Depends(get_current_account),
):
    _require_access(db, account.id, person_id)
    return crud.get_access_list(db, person_id)


@router.post("/{person_id}/access", status_code=204)
def grant_access(
    person_id: int,
    payload: schemas.AccessGrantByUsername,
    db: Session = Depends(database.get_db),
    account=Depends(get_current_account),
):
    """Grant another account access by username. Requester must already have access."""
    _require_access(db, account.id, person_id)
    target = crud.get_account_by_username(db, payload.username)
    if target is None:
        raise HTTPException(status_code=404, detail="No account with that username")
    crud.grant_access(db, target.id, person_id)
    crud.write_audit(db, "person", person_id, "access_granted", account.id,
                     f"Granted access to '{target.username}'")


@router.delete("/{person_id}/access/{target_account_id}", status_code=204)
def revoke_access(
    person_id: int,
    target_account_id: int,
    db: Session = Depends(database.get_db),
    account=Depends(get_current_account),
):
    _require_access(db, account.id, person_id)
    if target_account_id == account.id:
        raise HTTPException(status_code=400, detail="Cannot remove your own access")
    target = crud.get_account_by_id(db, target_account_id)
    crud.revoke_access(db, target_account_id, person_id)
    crud.write_audit(db, "person", person_id, "access_revoked", account.id,
                     f"Revoked access from '{target.username if target else target_account_id}'")


def _require_access(db, account_id: int, person_id: int):
    if not crud.account_can_access_person(db, account_id, person_id):
        raise HTTPException(status_code=403, detail="Access denied")
