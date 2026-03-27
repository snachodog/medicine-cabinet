# backend/schemas.py
import re
from decimal import Decimal
from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import date, datetime


# ── Auth ─────────────────────────────────────────────────────────────────────

class AccountCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str
    invite_code: Optional[str] = None

    @validator("username")
    def username_valid(cls, v):
        if not re.match(r"^[a-zA-Z0-9_.\-]+$", v):
            raise ValueError("Username may only contain letters, numbers, underscores, hyphens, and dots")
        return v

    @validator("password")
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number")
        if not re.search(r"[^A-Za-z0-9]", v):
            raise ValueError("Password must contain at least one special character")
        return v

class AccountUpdate(BaseModel):
    email: Optional[str] = Field(None, max_length=254)

class AccountResponse(BaseModel):
    id: int
    username: str
    is_active: bool
    email: Optional[str]

    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class InviteCodeCreate(BaseModel):
    expires_in_days: Optional[int] = Field(None, ge=1, le=365)

class InviteCodeResponse(BaseModel):
    id: int
    code: str
    created_at: datetime
    expires_at: Optional[datetime]
    used_at: Optional[datetime]
    used_by_username: Optional[str] = None

    class Config:
        orm_mode = True


# ── Person ────────────────────────────────────────────────────────────────────

class PersonCreate(BaseModel):
    name: str = Field(..., max_length=200)
    allergies: Optional[str] = Field(None, max_length=2000)
    notes: Optional[str] = Field(None, max_length=2000)

class PersonUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=200)
    allergies: Optional[str] = Field(None, max_length=2000)
    notes: Optional[str] = Field(None, max_length=2000)

class PersonResponse(BaseModel):
    id: int
    name: str
    allergies: Optional[str]
    notes: Optional[str]

    class Config:
        orm_mode = True


# ── Account–Person access ─────────────────────────────────────────────────────

class AccessGrantByUsername(BaseModel):
    username: str = Field(..., min_length=1, max_length=50)

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
    name: str = Field(..., max_length=200)
    type: str = Field(..., max_length=50)
    dose_amount: Optional[str] = Field(None, max_length=100)
    schedule: str = Field(..., max_length=50)
    notes: Optional[str] = Field(None, max_length=2000)

class MedicationUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=200)
    type: Optional[str] = Field(None, max_length=50)
    dose_amount: Optional[str] = Field(None, max_length=100)
    schedule: Optional[str] = Field(None, max_length=50)
    is_active: Optional[bool] = None
    notes: Optional[str] = Field(None, max_length=2000)

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
    prescriber: Optional[str] = Field(None, max_length=200)
    pharmacy: Optional[str] = Field(None, max_length=200)
    days_supply: int = 30
    scripts_remaining: int = 0
    last_fill_date: Optional[date] = None
    next_eligible_date: Optional[date] = None
    expiration_date: Optional[date] = None
    co_pay: Optional[Decimal] = None
    notes: Optional[str] = Field(None, max_length=2000)

class PrescriptionUpdate(BaseModel):
    prescriber: Optional[str] = Field(None, max_length=200)
    pharmacy: Optional[str] = Field(None, max_length=200)
    days_supply: Optional[int] = None
    scripts_remaining: Optional[int] = None
    last_fill_date: Optional[date] = None
    next_eligible_date: Optional[date] = None
    expiration_date: Optional[date] = None
    co_pay: Optional[Decimal] = None
    notes: Optional[str] = Field(None, max_length=2000)

class PrescriptionResponse(BaseModel):
    id: int
    medication_id: int
    prescriber: Optional[str]
    pharmacy: Optional[str]
    days_supply: int
    scripts_remaining: int
    last_fill_date: Optional[date]
    next_eligible_date: Optional[date]
    expiration_date: Optional[date]
    co_pay: Optional[Decimal]
    notes: Optional[str]

    class Config:
        orm_mode = True


# ── Fill ──────────────────────────────────────────────────────────────────────

class FillCreate(BaseModel):
    fill_date: date
    pharmacy: Optional[str] = Field(None, max_length=200)
    notes: Optional[str] = Field(None, max_length=2000)

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
    taken_at: Optional[datetime] = None
    notes: Optional[str] = Field(None, max_length=2000)

class DoseLogResponse(BaseModel):
    id: int
    medication_id: int
    person_id: int
    logged_by_account_id: int
    taken_at: datetime
    notes: Optional[str]

    class Config:
        orm_mode = True


# ── Prescription with context (list endpoint) ─────────────────────────────────

class PrescriptionWithContext(PrescriptionResponse):
    medication_name: str
    medication_type: str
    person_id: int
    person_name: str

    class Config:
        orm_mode = True


# ── Notification Preferences ──────────────────────────────────────────────────

class NotificationPrefUpdate(BaseModel):
    ntfy_url: Optional[str] = Field(None, max_length=500)
    ntfy_token: Optional[str] = Field(None, max_length=500)
    refill_reminder_days: Optional[int] = None
    scripts_low_threshold: Optional[int] = None
    email_enabled: Optional[bool] = None

class NotificationPrefResponse(BaseModel):
    id: int
    account_id: int
    ntfy_url: Optional[str]
    ntfy_token: Optional[str]
    refill_reminder_days: int
    scripts_low_threshold: int
    calendar_token: Optional[str]
    email_enabled: bool

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


# ── Provider ──────────────────────────────────────────────────────────────────

class ProviderCreate(BaseModel):
    name: str = Field(..., max_length=200)
    practice_name: Optional[str] = Field(None, max_length=200)
    specialty: Optional[str] = Field(None, max_length=200)
    phone: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = Field(None, max_length=500)
    website: Optional[str] = Field(None, max_length=500)
    notes: Optional[str] = Field(None, max_length=2000)

class ProviderUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=200)
    practice_name: Optional[str] = Field(None, max_length=200)
    specialty: Optional[str] = Field(None, max_length=200)
    phone: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = Field(None, max_length=500)
    website: Optional[str] = Field(None, max_length=500)
    notes: Optional[str] = Field(None, max_length=2000)

class ProviderResponse(BaseModel):
    id: int
    account_id: int
    name: str
    practice_name: Optional[str]
    specialty: Optional[str]
    phone: Optional[str]
    address: Optional[str]
    website: Optional[str]
    notes: Optional[str]

    class Config:
        orm_mode = True


# ── Pharmacy ──────────────────────────────────────────────────────────────────

class PharmacyCreate(BaseModel):
    name: str = Field(..., max_length=200)
    phone: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = Field(None, max_length=500)
    website: Optional[str] = Field(None, max_length=500)
    notes: Optional[str] = Field(None, max_length=2000)

class PharmacyUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=200)
    phone: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = Field(None, max_length=500)
    website: Optional[str] = Field(None, max_length=500)
    notes: Optional[str] = Field(None, max_length=2000)

class PharmacyResponse(BaseModel):
    id: int
    account_id: int
    name: str
    phone: Optional[str]
    address: Optional[str]
    website: Optional[str]
    notes: Optional[str]

    class Config:
        orm_mode = True


# ── Calendar feed ─────────────────────────────────────────────────────────────

class CalendarTokenResponse(BaseModel):
    token: str
    subscribe_url: str
