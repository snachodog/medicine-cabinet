# backend/routers/prescriptions.py
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .. import crud, schemas, database
from ..auth import get_current_account

router = APIRouter(prefix="/prescriptions", tags=["prescriptions"])


@router.post("", response_model=schemas.PrescriptionResponse, status_code=201)
def create_prescription(
    payload: schemas.PrescriptionCreate,
    db: Session = Depends(database.get_db),
    account=Depends(get_current_account),
):
    med = crud.get_medication(db, payload.medication_id)
    if med is None:
        raise HTTPException(status_code=404, detail="Medication not found")
    _require_access(db, account.id, med.person_id)
    if crud.get_prescription_for_medication(db, payload.medication_id):
        raise HTTPException(status_code=409, detail="Prescription already exists for this medication")
    rx = crud.create_prescription(db, payload)
    crud.write_audit(db, "prescription", rx.id, "create", account.id, f"Created prescription for '{med.name}'")
    return rx


@router.get("/medication/{medication_id}", response_model=schemas.PrescriptionResponse)
def get_prescription_by_medication(
    medication_id: int,
    db: Session = Depends(database.get_db),
    account=Depends(get_current_account),
):
    med = crud.get_medication(db, medication_id)
    if med is None:
        raise HTTPException(status_code=404, detail="Medication not found")
    _require_access(db, account.id, med.person_id)
    rx = crud.get_prescription_for_medication(db, medication_id)
    if rx is None:
        raise HTTPException(status_code=404, detail="No prescription for this medication")
    return rx


@router.get("/{prescription_id}", response_model=schemas.PrescriptionResponse)
def get_prescription(
    prescription_id: int,
    db: Session = Depends(database.get_db),
    account=Depends(get_current_account),
):
    rx = _get_or_404(db, prescription_id)
    _require_access(db, account.id, rx.medication.person_id)
    return rx


@router.patch("/{prescription_id}", response_model=schemas.PrescriptionResponse)
def update_prescription(
    prescription_id: int,
    payload: schemas.PrescriptionUpdate,
    db: Session = Depends(database.get_db),
    account=Depends(get_current_account),
):
    rx = _get_or_404(db, prescription_id)
    _require_access(db, account.id, rx.medication.person_id)
    updated = crud.update_prescription(db, prescription_id, payload)
    crud.write_audit(db, "prescription", prescription_id, "update", account.id, f"Updated prescription for '{rx.medication.name}'")
    return updated


@router.delete("/{prescription_id}", status_code=204)
def delete_prescription(
    prescription_id: int,
    db: Session = Depends(database.get_db),
    account=Depends(get_current_account),
):
    rx = _get_or_404(db, prescription_id)
    _require_access(db, account.id, rx.medication.person_id)
    crud.delete_prescription(db, prescription_id)
    crud.write_audit(db, "prescription", prescription_id, "delete", account.id, f"Deleted prescription for '{rx.medication.name}'")


# ── Fills ─────────────────────────────────────────────────────────────────────

@router.post("/{prescription_id}/fills", response_model=schemas.FillResponse, status_code=201)
def log_fill(
    prescription_id: int,
    payload: schemas.FillCreate,
    db: Session = Depends(database.get_db),
    account=Depends(get_current_account),
):
    rx = _get_or_404(db, prescription_id)
    _require_access(db, account.id, rx.medication.person_id)
    fill = crud.log_fill(db, prescription_id, payload, account.id)
    crud.write_audit(db, "fill", fill.id, "create", account.id, f"Logged fill for '{rx.medication.name}' on {payload.fill_date}")
    return fill


@router.get("/{prescription_id}/fills", response_model=List[schemas.FillResponse])
def list_fills(
    prescription_id: int,
    db: Session = Depends(database.get_db),
    account=Depends(get_current_account),
):
    rx = _get_or_404(db, prescription_id)
    _require_access(db, account.id, rx.medication.person_id)
    return crud.get_fills(db, prescription_id)


@router.get("", response_model=List[schemas.PrescriptionWithContext])
def list_prescriptions(
    db: Session = Depends(database.get_db),
    account=Depends(get_current_account),
):
    """Return all prescriptions across persons the account can access."""
    from .. import crud as _crud
    persons = _crud.get_accessible_persons(db, account.id)
    results = []
    for person in persons:
        meds = _crud.get_medications_for_person(db, person.id, active_only=True)
        for med in meds:
            if med.prescription:
                rx = med.prescription
                results.append(schemas.PrescriptionWithContext(
                    id=rx.id,
                    medication_id=rx.medication_id,
                    prescriber=rx.prescriber,
                    pharmacy=rx.pharmacy,
                    days_supply=rx.days_supply,
                    scripts_remaining=rx.scripts_remaining,
                    last_fill_date=rx.last_fill_date,
                    next_eligible_date=rx.next_eligible_date,
                    expiration_date=rx.expiration_date,
                    co_pay=rx.co_pay,
                    notes=rx.notes,
                    medication_name=med.name,
                    medication_type=med.type,
                    person_id=person.id,
                    person_name=person.name,
                ))
    results.sort(key=lambda r: (r.next_eligible_date or date.max))
    return results


def _get_or_404(db, prescription_id: int):
    rx = crud.get_prescription(db, prescription_id)
    if rx is None:
        raise HTTPException(status_code=404, detail="Prescription not found")
    return rx

def _require_access(db, account_id: int, person_id: int):
    if not crud.account_can_access_person(db, account_id, person_id):
        raise HTTPException(status_code=403, detail="Access denied")
