# backend/crud.py
# ---------------
# CRUD operations for MediCabinet entities

from typing import Optional
from sqlalchemy import or_
from sqlalchemy.orm import Session
from . import models, schemas


# Account CRUD

def get_account_by_username(db: Session, username: str):
    return db.query(models.Account).filter(models.Account.username == username).first()

def create_account(db: Session, username: str, hashed_password: str):
    db_account = models.Account(username=username, hashed_password=hashed_password)
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return db_account


# Person CRUD (formerly User)

def create_person(db: Session, person: schemas.PersonCreate):
    db_person = models.Person(**person.dict())
    db.add(db_person)
    db.commit()
    db.refresh(db_person)
    return db_person

def get_persons(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Person).offset(skip).limit(limit).all()

def get_person(db: Session, person_id: int):
    return db.query(models.Person).filter(models.Person.id == person_id).first()

def update_person(db: Session, person_id: int, person: schemas.PersonUpdate):
    db_person = db.query(models.Person).filter(models.Person.id == person_id).first()
    if db_person is None:
        return None
    for field, value in person.dict(exclude_unset=True).items():
        setattr(db_person, field, value)
    db.commit()
    db.refresh(db_person)
    return db_person

def delete_person(db: Session, person_id: int):
    db_person = db.query(models.Person).filter(models.Person.id == person_id).first()
    if db_person is None:
        return None
    db.delete(db_person)
    db.commit()
    return db_person


# Medication CRUD

def create_medication(db: Session, medication: schemas.MedicationCreate):
    db_med = models.Medication(**medication.dict())
    db.add(db_med)
    db.commit()
    db.refresh(db_med)
    return db_med

def get_medications(db: Session, skip: int = 0, limit: int = 100, search: Optional[str] = None):
    query = db.query(models.Medication)
    if search:
        term = f"%{search}%"
        query = query.filter(or_(
            models.Medication.name.ilike(term),
            models.Medication.brand_name.ilike(term),
            models.Medication.category.ilike(term),
        ))
    return query.offset(skip).limit(limit).all()

def get_medication(db: Session, medication_id: int):
    return db.query(models.Medication).filter(models.Medication.id == medication_id).first()

def update_medication(db: Session, medication_id: int, medication: schemas.MedicationUpdate):
    db_med = db.query(models.Medication).filter(models.Medication.id == medication_id).first()
    if db_med is None:
        return None
    for field, value in medication.dict(exclude_unset=True).items():
        setattr(db_med, field, value)
    db.commit()
    db.refresh(db_med)
    return db_med

def delete_medication(db: Session, medication_id: int):
    db_med = db.query(models.Medication).filter(models.Medication.id == medication_id).first()
    if db_med is None:
        return None
    db.delete(db_med)
    db.commit()
    return db_med


# Prescription CRUD

def create_prescription(db: Session, prescription: schemas.PrescriptionCreate):
    db_rx = models.Prescription(**prescription.dict())
    db.add(db_rx)
    db.commit()
    db.refresh(db_rx)
    return db_rx

def get_prescriptions(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Prescription).offset(skip).limit(limit).all()

def get_prescription(db: Session, prescription_id: int):
    return db.query(models.Prescription).filter(models.Prescription.id == prescription_id).first()

def update_prescription(
    db: Session, prescription_id: int, prescription: schemas.PrescriptionUpdate
):
    db_rx = db.query(models.Prescription).filter(
        models.Prescription.id == prescription_id
    ).first()
    if db_rx is None:
        return None
    for field, value in prescription.dict(exclude_unset=True).items():
        setattr(db_rx, field, value)
    db.commit()
    db.refresh(db_rx)
    return db_rx

def delete_prescription(db: Session, prescription_id: int):
    db_rx = db.query(models.Prescription).filter(
        models.Prescription.id == prescription_id
    ).first()
    if db_rx is None:
        return None
    db.delete(db_rx)
    db.commit()
    return db_rx


# Consumable CRUD

def create_consumable(db: Session, consumable: schemas.ConsumableCreate):
    db_item = models.Consumable(**consumable.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def get_consumables(db: Session, skip: int = 0, limit: int = 100, search: Optional[str] = None):
    query = db.query(models.Consumable)
    if search:
        term = f"%{search}%"
        query = query.filter(or_(
            models.Consumable.name.ilike(term),
            models.Consumable.category.ilike(term),
        ))
    return query.offset(skip).limit(limit).all()

def get_consumable(db: Session, consumable_id: int):
    return db.query(models.Consumable).filter(models.Consumable.id == consumable_id).first()

def update_consumable(db: Session, consumable_id: int, consumable: schemas.ConsumableUpdate):
    db_item = db.query(models.Consumable).filter(
        models.Consumable.id == consumable_id
    ).first()
    if db_item is None:
        return None
    for field, value in consumable.dict(exclude_unset=True).items():
        setattr(db_item, field, value)
    db.commit()
    db.refresh(db_item)
    return db_item

def delete_consumable(db: Session, consumable_id: int):
    db_item = db.query(models.Consumable).filter(
        models.Consumable.id == consumable_id
    ).first()
    if db_item is None:
        return None
    db.delete(db_item)
    db.commit()
    return db_item
