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

class Consumable(ConsumableBase):
    id: int

    class Config:
        orm_mode = True
