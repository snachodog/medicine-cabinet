# backend/routers/persons.py
from datetime import date as date_type

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from fpdf import FPDF
from fpdf.enums import XPos, YPos
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


@router.get("/{person_id}/export.pdf")
def export_person_pdf(
    person_id: int,
    db: Session = Depends(database.get_db),
    account=Depends(get_current_account),
):
    _require_access(db, account.id, person_id)
    person = crud.get_person(db, person_id)
    if person is None:
        raise HTTPException(status_code=404, detail="Person not found")

    meds = crud.get_medications_for_person(db, person_id, active_only=True)

    # Most recent dose log per medication
    recent_doses = {}
    for med in meds:
        logs = crud.get_dose_logs(db, person_id, medication_id=med.id, limit=1)
        recent_doses[med.id] = logs[0].taken_at if logs else None

    pdf = FPDF()
    pdf.set_margins(15, 15, 15)
    pdf.add_page()

    # ── Header ────────────────────────────────────────────────────────────────
    pdf.set_font("Helvetica", "B", 18)
    pdf.cell(0, 10, "Medication Report", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    pdf.set_font("Helvetica", "B", 13)
    pdf.cell(0, 8, person.name, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    pdf.set_font("Helvetica", "", 9)
    pdf.cell(0, 5, f"Generated: {date_type.today().strftime('%B %d, %Y')}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(3)

    # ── Allergies ─────────────────────────────────────────────────────────────
    if person.allergies:
        pdf.set_fill_color(255, 230, 230)
        pdf.set_font("Helvetica", "B", 10)
        pdf.cell(0, 7, f"  Allergies: {person.allergies}", fill=True, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.ln(2)
    elif person.notes:
        pdf.set_font("Helvetica", "I", 9)
        pdf.cell(0, 6, f"Notes: {person.notes}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.ln(2)

    # ── Medications table ─────────────────────────────────────────────────────
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(0, 7, "Current Medications", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(1)

    # Column widths (total = 180mm usable width)
    col = {"name": 45, "dose": 25, "sched": 22, "prescriber": 35, "rx": 30, "last": 23}

    pdf.set_fill_color(230, 237, 255)
    pdf.set_font("Helvetica", "B", 8)
    pdf.cell(col["name"],    6, "Medication",      border=1, fill=True)
    pdf.cell(col["dose"],    6, "Dose",            border=1, fill=True)
    pdf.cell(col["sched"],   6, "Schedule",        border=1, fill=True)
    pdf.cell(col["prescriber"], 6, "Prescriber",   border=1, fill=True)
    pdf.cell(col["rx"],      6, "Scripts / Next fill", border=1, fill=True)
    pdf.cell(col["last"],    6, "Last taken",      border=1, fill=True, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    pdf.set_font("Helvetica", "", 8)
    fill = False
    pdf.set_fill_color(247, 247, 247)

    for med in meds:
        rx = med.prescription
        scripts = str(rx.scripts_remaining) if rx else "-"
        next_fill = rx.next_eligible_date.strftime("%m/%d/%y") if rx and rx.next_eligible_date else "-"
        rx_cell = f"{scripts} scripts / {next_fill}"
        prescriber = (rx.prescriber or "-") if rx else "-"
        last = (
            recent_doses[med.id].strftime("%m/%d/%y %H:%M")
            if recent_doses[med.id] else "-"
        )
        pdf.cell(col["name"],       6, med.name[:28],           border=1, fill=fill)
        pdf.cell(col["dose"],       6, (med.dose_amount or "-")[:14], border=1, fill=fill)
        pdf.cell(col["sched"],      6, med.schedule,            border=1, fill=fill)
        pdf.cell(col["prescriber"], 6, prescriber[:22],         border=1, fill=fill)
        pdf.cell(col["rx"],         6, rx_cell[:22],            border=1, fill=fill)
        pdf.cell(col["last"],       6, last,                    border=1, fill=fill, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        fill = not fill

    pdf.ln(5)
    pdf.set_font("Helvetica", "I", 7)
    pdf.cell(0, 5, "This report is for informational purposes only. Always follow your provider's instructions.", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    pdf_bytes = pdf.output()
    filename = f"{person.name.replace(' ', '_')}_medications.pdf"
    return Response(
        content=bytes(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


def _require_access(db, account_id: int, person_id: int):
    if not crud.account_can_access_person(db, account_id, person_id):
        raise HTTPException(status_code=403, detail="Access denied")
