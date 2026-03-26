# backend/crud.py
from datetime import date, datetime, timedelta
from typing import List, Optional

from sqlalchemy.orm import Session

from . import models, schemas


# ── Account ───────────────────────────────────────────────────────────────────

def get_account_by_username(db: Session, username: str):
    return db.query(models.Account).filter(models.Account.username == username).first()

def create_account(db: Session, username: str, hashed_password: str):
    account = models.Account(username=username, hashed_password=hashed_password)
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


# ── Person ────────────────────────────────────────────────────────────────────

def create_person(db: Session, payload: schemas.PersonCreate):
    person = models.Person(**payload.dict())
    db.add(person)
    db.commit()
    db.refresh(person)
    return person

def get_person(db: Session, person_id: int):
    return db.query(models.Person).filter(models.Person.id == person_id).first()

def get_persons(db: Session):
    return db.query(models.Person).order_by(models.Person.name).all()

def update_person(db: Session, person_id: int, payload: schemas.PersonUpdate):
    person = db.query(models.Person).filter(models.Person.id == person_id).first()
    if person is None:
        return None
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(person, field, value)
    db.commit()
    db.refresh(person)
    return person

def delete_person(db: Session, person_id: int):
    person = db.query(models.Person).filter(models.Person.id == person_id).first()
    if person is None:
        return None
    db.delete(person)
    db.commit()
    return person


# ── Account–Person access ─────────────────────────────────────────────────────

def get_accessible_persons(db: Session, account_id: int) -> List[models.Person]:
    return (
        db.query(models.Person)
        .join(models.AccountPersonAccess)
        .filter(models.AccountPersonAccess.account_id == account_id)
        .order_by(models.Person.name)
        .all()
    )

def grant_access(db: Session, account_id: int, person_id: int):
    existing = db.query(models.AccountPersonAccess).filter_by(
        account_id=account_id, person_id=person_id
    ).first()
    if existing:
        return existing
    link = models.AccountPersonAccess(account_id=account_id, person_id=person_id)
    db.add(link)
    db.commit()
    return link

def revoke_access(db: Session, account_id: int, person_id: int):
    link = db.query(models.AccountPersonAccess).filter_by(
        account_id=account_id, person_id=person_id
    ).first()
    if link:
        db.delete(link)
        db.commit()

def account_can_access_person(db: Session, account_id: int, person_id: int) -> bool:
    return db.query(models.AccountPersonAccess).filter_by(
        account_id=account_id, person_id=person_id
    ).first() is not None


# ── Medication Catalog ────────────────────────────────────────────────────────

def search_catalog(db: Session, q: Optional[str] = None):
    query = db.query(models.MedicationCatalog).order_by(models.MedicationCatalog.name)
    if q:
        query = query.filter(models.MedicationCatalog.name.ilike(f"%{q}%"))
    return query.all()

def get_catalog_entry(db: Session, catalog_id: int):
    return db.query(models.MedicationCatalog).filter(
        models.MedicationCatalog.id == catalog_id
    ).first()


# ── Medication ────────────────────────────────────────────────────────────────

def create_medication(db: Session, payload: schemas.MedicationCreate):
    med = models.Medication(**payload.dict())
    db.add(med)
    db.commit()
    db.refresh(med)
    return med

def get_medication(db: Session, medication_id: int):
    return db.query(models.Medication).filter(models.Medication.id == medication_id).first()

def get_medications_for_person(db: Session, person_id: int, active_only: bool = True):
    q = db.query(models.Medication).filter(models.Medication.person_id == person_id)
    if active_only:
        q = q.filter(models.Medication.is_active == True)
    return q.order_by(models.Medication.schedule, models.Medication.name).all()

def update_medication(db: Session, medication_id: int, payload: schemas.MedicationUpdate):
    med = db.query(models.Medication).filter(models.Medication.id == medication_id).first()
    if med is None:
        return None
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(med, field, value)
    db.commit()
    db.refresh(med)
    return med

def delete_medication(db: Session, medication_id: int):
    med = db.query(models.Medication).filter(models.Medication.id == medication_id).first()
    if med is None:
        return None
    db.delete(med)
    db.commit()
    return med


# ── Prescription ──────────────────────────────────────────────────────────────

def create_prescription(db: Session, payload: schemas.PrescriptionCreate):
    rx = models.Prescription(**payload.dict())
    db.add(rx)
    db.commit()
    db.refresh(rx)
    return rx

def get_prescription(db: Session, prescription_id: int):
    return db.query(models.Prescription).filter(
        models.Prescription.id == prescription_id
    ).first()

def get_prescription_for_medication(db: Session, medication_id: int):
    return db.query(models.Prescription).filter(
        models.Prescription.medication_id == medication_id
    ).first()

def update_prescription(db: Session, prescription_id: int, payload: schemas.PrescriptionUpdate):
    rx = db.query(models.Prescription).filter(
        models.Prescription.id == prescription_id
    ).first()
    if rx is None:
        return None
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(rx, field, value)
    db.commit()
    db.refresh(rx)
    return rx

def delete_prescription(db: Session, prescription_id: int):
    rx = db.query(models.Prescription).filter(
        models.Prescription.id == prescription_id
    ).first()
    if rx is None:
        return None
    db.delete(rx)
    db.commit()
    return rx


# ── Fill ──────────────────────────────────────────────────────────────────────

def log_fill(db: Session, prescription_id: int, payload: schemas.FillCreate, account_id: int):
    fill = models.Fill(
        prescription_id=prescription_id,
        logged_by_account_id=account_id,
        **payload.dict(),
    )
    db.add(fill)

    # Update prescription: decrement scripts_remaining, set last_fill_date,
    # compute next_eligible_date from days_supply.
    rx = db.query(models.Prescription).filter(
        models.Prescription.id == prescription_id
    ).first()
    if rx:
        if rx.scripts_remaining > 0:
            rx.scripts_remaining -= 1
        rx.last_fill_date = payload.fill_date
        rx.next_eligible_date = payload.fill_date + timedelta(days=rx.days_supply)

    db.commit()
    db.refresh(fill)
    return fill

def get_fills(db: Session, prescription_id: int):
    return (
        db.query(models.Fill)
        .filter(models.Fill.prescription_id == prescription_id)
        .order_by(models.Fill.fill_date.desc())
        .all()
    )


# ── Dose Log ──────────────────────────────────────────────────────────────────

def log_dose(db: Session, payload: schemas.DoseLogCreate, account_id: int):
    taken_at = payload.taken_at or datetime.utcnow()
    entry = models.DoseLog(
        medication_id=payload.medication_id,
        person_id=payload.person_id,
        logged_by_account_id=account_id,
        taken_at=taken_at,
        notes=payload.notes,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry

def get_dose_logs(
    db: Session,
    person_id: int,
    medication_id: Optional[int] = None,
    since: Optional[date] = None,
    limit: int = 100,
):
    q = db.query(models.DoseLog).filter(models.DoseLog.person_id == person_id)
    if medication_id:
        q = q.filter(models.DoseLog.medication_id == medication_id)
    if since:
        q = q.filter(models.DoseLog.taken_at >= datetime.combine(since, datetime.min.time()))
    return q.order_by(models.DoseLog.taken_at.desc()).limit(limit).all()

def get_dose_log(db: Session, dose_log_id: int):
    return db.query(models.DoseLog).filter(models.DoseLog.id == dose_log_id).first()

def delete_dose_log(db: Session, dose_log_id: int):
    entry = db.query(models.DoseLog).filter(models.DoseLog.id == dose_log_id).first()
    if entry is None:
        return None
    db.delete(entry)
    db.commit()
    return entry

def get_streak(db: Session, person_id: int, medication_id: int) -> int:
    """Return the current consecutive-day streak for a person/medication."""
    logs = (
        db.query(models.DoseLog)
        .filter(
            models.DoseLog.person_id == person_id,
            models.DoseLog.medication_id == medication_id,
        )
        .order_by(models.DoseLog.taken_at.desc())
        .all()
    )
    if not logs:
        return 0

    seen_dates = sorted(
        {entry.taken_at.date() for entry in logs},
        reverse=True,
    )

    streak = 0
    expected = date.today()
    for d in seen_dates:
        if d == expected or d == expected - timedelta(days=1) and streak == 0:
            # Allow today or yesterday to start the streak
            streak += 1
            expected = d - timedelta(days=1)
        elif d == expected:
            streak += 1
            expected = d - timedelta(days=1)
        else:
            break
    return streak


# ── Notification Preferences ──────────────────────────────────────────────────

def get_or_create_notification_pref(db: Session, account_id: int):
    pref = db.query(models.NotificationPreference).filter(
        models.NotificationPreference.account_id == account_id
    ).first()
    if pref is None:
        pref = models.NotificationPreference(account_id=account_id)
        db.add(pref)
        db.commit()
        db.refresh(pref)
    return pref

def update_notification_pref(
    db: Session, account_id: int, payload: schemas.NotificationPrefUpdate
):
    pref = get_or_create_notification_pref(db, account_id)
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(pref, field, value)
    db.commit()
    db.refresh(pref)
    return pref
