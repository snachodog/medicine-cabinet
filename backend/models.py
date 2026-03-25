# backend/models.py
# -----------------
# SQLAlchemy models for MVP entities
# TODO: Separate the User model into Account (login credentials) and Person (whose meds
# are tracked). A household may have one Account but multiple Persons. Add an Account
# model with hashed_password and a one-to-many relationship to Person. Migrate existing
# User records to Person and create Alembic migrations for the change.
# TODO: Add an AuditLog model to record create/update/delete events with entity_type,
# entity_id, action, changed_by, and timestamp. Wire it into CRUD operations so all
# changes are traceable.

from sqlalchemy import Column, Integer, String, Text, Date, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True)
    allergies = Column(Text)
    medical_conditions = Column(Text)
    emergency_contact = Column(String)

    prescriptions = relationship("Prescription", back_populates="user")


class Medication(Base):
    __tablename__ = "medications"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    brand_name = Column(String)
    form = Column(String)
    dosage = Column(String)
    instructions = Column(Text)
    category = Column(String)
    notes = Column(Text)

    prescriptions = relationship("Prescription", back_populates="medication")


class Prescription(Base):
    __tablename__ = "prescriptions"
    id = Column(Integer, primary_key=True, index=True)
    medication_id = Column(Integer, ForeignKey("medications.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    date_prescribed = Column(Date)
    date_filled = Column(Date)
    refills_remaining = Column(Integer)
    expiration_date = Column(Date)
    status = Column(String, default="active")
    notes = Column(Text)

    user = relationship("User", back_populates="prescriptions")
    medication = relationship("Medication", back_populates="prescriptions")


class Consumable(Base):
    __tablename__ = "consumables"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    category = Column(String)
    quantity = Column(Integer, default=0)
    reorder_threshold = Column(Integer, default=0)
    storage_location = Column(String)
    notes = Column(Text)
