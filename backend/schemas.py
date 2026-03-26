# backend/schemas.py
from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime


# ── Auth ─────────────────────────────────────────────────────────────────────

class AccountCreate(BaseModel):
    username: str
    password: str

class AccountResponse(BaseModel):
    id: int
    username: str
    is_active: bool

    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None


# ── Person ────────────────────────────────────────────────────────────────────

class PersonCreate(BaseModel):
    name: str
    allergies: Optional[str] = None
    notes: Optional[str] = None

class PersonUpdate(BaseModel):
    name: Optional[str] = None
    allergies: Optional[str] = None
    notes: Optional[str] = None

class PersonResponse(BaseModel):
    id: int
    name: str
    allergies: Optional[str]
    notes: Optional[str]

    class Config:
        orm_mode = True


# ── Account–Person access ─────────────────────────────────────────────────────

class AccessGrantByUsername(BaseModel):
    username: str

class AccessEntry(BaseModel):
    account_id: int
    username: str


# ── Medication Catalog ────────────────────────────────────────────────────────

class CatalogEntryResponse(BaseModel):
    id: int
    name: str
    type: str
    default_dose_amount: Optional[str]
    notes: Optional[str]

    class Config:
        orm_mode = True


# ── Medication ────────────────────────────────────────────────────────────────

class MedicationCreate(BaseModel):
    person_id: int
    catalog_id: Optional[int] = None
    name: str
    type: str                       # otc | supplement | rx | schedule_ii
    dose_amount: Optional[str] = None
    schedule: str                   # morning | evening | as_needed
    notes: Optional[str] = None

class MedicationUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    dose_amount: Optional[str] = None
    schedule: Optional[str] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None

class MedicationResponse(BaseModel):
    id: int
    person_id: int
    catalog_id: Optional[int]
    name: str
    type: str
    dose_amount: Optional[str]
    schedule: str
    is_active: bool
    notes: Optional[str]

    class Config:
        orm_mode = True


# ── Prescription ──────────────────────────────────────────────────────────────

class PrescriptionCreate(BaseModel):
    medication_id: int
    prescriber: Optional[str] = None
    pharmacy: Optional[str] = None
    days_supply: int = 30
    scripts_remaining: int = 0
    last_fill_date: Optional[date] = None
    next_eligible_date: Optional[date] = None
    notes: Optional[str] = None

class PrescriptionUpdate(BaseModel):
    prescriber: Optional[str] = None
    pharmacy: Optional[str] = None
    days_supply: Optional[int] = None
    scripts_remaining: Optional[int] = None
    last_fill_date: Optional[date] = None
    next_eligible_date: Optional[date] = None
    notes: Optional[str] = None

class PrescriptionResponse(BaseModel):
    id: int
    medication_id: int
    prescriber: Optional[str]
    pharmacy: Optional[str]
    days_supply: int
    scripts_remaining: int
    last_fill_date: Optional[date]
    next_eligible_date: Optional[date]
    notes: Optional[str]

    class Config:
        orm_mode = True


# ── Fill ──────────────────────────────────────────────────────────────────────

class FillCreate(BaseModel):
    fill_date: date
    pharmacy: Optional[str] = None
    notes: Optional[str] = None

class FillResponse(BaseModel):
    id: int
    prescription_id: int
    fill_date: date
    pharmacy: Optional[str]
    notes: Optional[str]
    logged_by_account_id: Optional[int]

    class Config:
        orm_mode = True


# ── Dose Log ──────────────────────────────────────────────────────────────────

class DoseLogCreate(BaseModel):
    medication_id: int
    person_id: int
    taken_at: Optional[datetime] = None   # defaults to now() if omitted
    notes: Optional[str] = None

class DoseLogResponse(BaseModel):
    id: int
    medication_id: int
    person_id: int
    logged_by_account_id: int
    taken_at: datetime
    notes: Optional[str]

    class Config:
        orm_mode = True


# ── Notification Preferences ──────────────────────────────────────────────────

class PrescriptionWithContext(PrescriptionResponse):
    medication_name: str
    medication_type: str
    person_id: int
    person_name: str

    class Config:
        orm_mode = True


class NotificationPrefUpdate(BaseModel):
    ntfy_url: Optional[str] = None
    ntfy_token: Optional[str] = None
    refill_reminder_days: Optional[int] = None
    scripts_low_threshold: Optional[int] = None

class NotificationPrefResponse(BaseModel):
    id: int
    account_id: int
    ntfy_url: Optional[str]
    ntfy_token: Optional[str]
    refill_reminder_days: int
    scripts_low_threshold: int

    class Config:
        orm_mode = True


# ── Audit Log ─────────────────────────────────────────────────────────────────

class AuditLogResponse(BaseModel):
    id: int
    timestamp: datetime
    account_id: Optional[int]
    username: Optional[str]
    entity_type: str
    entity_id: int
    action: str
    detail: Optional[str]

    class Config:
        orm_mode = True
