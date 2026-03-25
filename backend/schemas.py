# backend/schemas.py
# ------------------
# Pydantic schemas for request/response models

from pydantic import BaseModel
from typing import Optional, List
from datetime import date

class UserBase(BaseModel):
    name: str
    email: Optional[str]
    allergies: Optional[str]
    medical_conditions: Optional[str]
    emergency_contact: Optional[str]

class UserCreate(UserBase):
    pass

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    allergies: Optional[str] = None
    medical_conditions: Optional[str] = None
    emergency_contact: Optional[str] = None

class User(UserBase):
    id: int

    class Config:
        orm_mode = True


class MedicationBase(BaseModel):
    name: str
    brand_name: Optional[str]
    form: Optional[str]
    dosage: Optional[str]
    instructions: Optional[str]
    category: Optional[str]
    notes: Optional[str]

class MedicationCreate(MedicationBase):
    pass

class MedicationUpdate(BaseModel):
    name: Optional[str] = None
    brand_name: Optional[str] = None
    form: Optional[str] = None
    dosage: Optional[str] = None
    instructions: Optional[str] = None
    category: Optional[str] = None
    notes: Optional[str] = None

class Medication(MedicationBase):
    id: int

    class Config:
        orm_mode = True


class PrescriptionBase(BaseModel):
    medication_id: int
    user_id: int
    date_prescribed: Optional[date]
    date_filled: Optional[date]
    refills_remaining: Optional[int]
    expiration_date: Optional[date]
    status: Optional[str]
    notes: Optional[str]

class PrescriptionCreate(PrescriptionBase):
    pass

class PrescriptionUpdate(BaseModel):
    medication_id: Optional[int] = None
    user_id: Optional[int] = None
    date_prescribed: Optional[date] = None
    date_filled: Optional[date] = None
    refills_remaining: Optional[int] = None
    expiration_date: Optional[date] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class Prescription(PrescriptionBase):
    id: int

    class Config:
        orm_mode = True


class ConsumableBase(BaseModel):
    name: str
    category: Optional[str]
    quantity: Optional[int]
    reorder_threshold: Optional[int]
    storage_location: Optional[str]
    notes: Optional[str]

class ConsumableCreate(ConsumableBase):
    pass

class ConsumableUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[int] = None
    reorder_threshold: Optional[int] = None
    storage_location: Optional[str] = None
    notes: Optional[str] = None

class Consumable(ConsumableBase):
    id: int

    class Config:
        orm_mode = True
