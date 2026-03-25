# backend/crud.py
# ---------------
# CRUD operations for MediCabinet entities

from sqlalchemy.orm import Session
from . import models, schemas

# User CRUD

def create_user(db: Session, user: schemas.UserCreate):
    db_user = models.User(**user.dict())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()

def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def update_user(db: Session, user_id: int, user: schemas.UserUpdate):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user is None:
        return None
    for field, value in user.dict(exclude_unset=True).items():
        setattr(db_user, field, value)
    db.commit()
    db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user is None:
        return None
    db.delete(db_user)
    db.commit()
    return db_user


# Medication CRUD

def create_medication(db: Session, medication: schemas.MedicationCreate):
    db_med = models.Medication(**medication.dict())
    db.add(db_med)
    db.commit()
    db.refresh(db_med)
    return db_med

def get_medications(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Medication).offset(skip).limit(limit).all()

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

def update_prescription(db: Session, prescription_id: int, prescription: schemas.PrescriptionUpdate):
    db_rx = db.query(models.Prescription).filter(models.Prescription.id == prescription_id).first()
    if db_rx is None:
        return None
    for field, value in prescription.dict(exclude_unset=True).items():
        setattr(db_rx, field, value)
    db.commit()
    db.refresh(db_rx)
    return db_rx

def delete_prescription(db: Session, prescription_id: int):
    db_rx = db.query(models.Prescription).filter(models.Prescription.id == prescription_id).first()
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

def get_consumables(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Consumable).offset(skip).limit(limit).all()

def get_consumable(db: Session, consumable_id: int):
    return db.query(models.Consumable).filter(models.Consumable.id == consumable_id).first()

def update_consumable(db: Session, consumable_id: int, consumable: schemas.ConsumableUpdate):
    db_item = db.query(models.Consumable).filter(models.Consumable.id == consumable_id).first()
    if db_item is None:
        return None
    for field, value in consumable.dict(exclude_unset=True).items():
        setattr(db_item, field, value)
    db.commit()
    db.refresh(db_item)
    return db_item

def delete_consumable(db: Session, consumable_id: int):
    db_item = db.query(models.Consumable).filter(models.Consumable.id == consumable_id).first()
    if db_item is None:
        return None
    db.delete(db_item)
    db.commit()
    return db_item