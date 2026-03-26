# backend/models.py
from sqlalchemy import (
    Column, Integer, String, Boolean, Text, Date, DateTime, ForeignKey
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, server_default="true", nullable=False)

    person_access = relationship("AccountPersonAccess", back_populates="account")
    dose_logs = relationship("DoseLog", back_populates="logged_by")
    fills = relationship("Fill", back_populates="logged_by")
    notification_preference = relationship(
        "NotificationPreference", back_populates="account", uselist=False
    )


class Person(Base):
    __tablename__ = "persons"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    allergies = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)

    account_access = relationship("AccountPersonAccess", back_populates="person")
    medications = relationship("Medication", back_populates="person")
    dose_logs = relationship("DoseLog", back_populates="person")


class AccountPersonAccess(Base):
    """Which accounts can log doses on behalf of which persons."""
    __tablename__ = "account_person_access"

    account_id = Column(Integer, ForeignKey("accounts.id"), primary_key=True)
    person_id = Column(Integer, ForeignKey("persons.id"), primary_key=True)

    account = relationship("Account", back_populates="person_access")
    person = relationship("Person", back_populates="account_access")


class MedicationCatalog(Base):
    """Seed list of common medications and supplements for quick selection."""
    __tablename__ = "medication_catalog"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    type = Column(String, nullable=False)  # otc | supplement | rx | schedule_ii
    default_dose_amount = Column(String, nullable=True)
    notes = Column(Text, nullable=True)


class Medication(Base):
    __tablename__ = "medications"

    id = Column(Integer, primary_key=True, index=True)
    person_id = Column(Integer, ForeignKey("persons.id"), nullable=False)
    catalog_id = Column(Integer, ForeignKey("medication_catalog.id"), nullable=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # otc | supplement | rx | schedule_ii
    dose_amount = Column(String, nullable=True)
    schedule = Column(String, nullable=False)  # morning | evening | as_needed
    is_active = Column(Boolean, server_default="true", nullable=False)
    notes = Column(Text, nullable=True)

    person = relationship("Person", back_populates="medications")
    catalog = relationship("MedicationCatalog")
    prescription = relationship("Prescription", back_populates="medication", uselist=False)
    dose_logs = relationship("DoseLog", back_populates="medication")


class Prescription(Base):
    """Tracks fill status for a controlled or Rx medication."""
    __tablename__ = "prescriptions"

    id = Column(Integer, primary_key=True, index=True)
    medication_id = Column(Integer, ForeignKey("medications.id"), unique=True, nullable=False)
    prescriber = Column(String, nullable=True)
    pharmacy = Column(String, nullable=True)
    days_supply = Column(Integer, nullable=False, server_default="30")
    scripts_remaining = Column(Integer, nullable=False, server_default="0")
    last_fill_date = Column(Date, nullable=True)
    next_eligible_date = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)

    medication = relationship("Medication", back_populates="prescription")
    fills = relationship("Fill", back_populates="prescription", order_by="Fill.fill_date.desc()")


class Fill(Base):
    """A single pharmacy pickup. Logging one decrements scripts_remaining."""
    __tablename__ = "fills"

    id = Column(Integer, primary_key=True, index=True)
    prescription_id = Column(Integer, ForeignKey("prescriptions.id"), nullable=False)
    fill_date = Column(Date, nullable=False)
    pharmacy = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    logged_by_account_id = Column(Integer, ForeignKey("accounts.id"), nullable=True)

    prescription = relationship("Prescription", back_populates="fills")
    logged_by = relationship("Account", back_populates="fills")


class DoseLog(Base):
    """Records each time a person takes a medication."""
    __tablename__ = "dose_logs"

    id = Column(Integer, primary_key=True, index=True)
    medication_id = Column(Integer, ForeignKey("medications.id"), nullable=False)
    person_id = Column(Integer, ForeignKey("persons.id"), nullable=False)
    logged_by_account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    taken_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    notes = Column(Text, nullable=True)

    medication = relationship("Medication", back_populates="dose_logs")
    person = relationship("Person", back_populates="dose_logs")
    logged_by = relationship("Account", back_populates="dose_logs")


class NotificationPreference(Base):
    __tablename__ = "notification_preferences"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), unique=True, nullable=False)
    ntfy_url = Column(String, nullable=True)
    ntfy_token = Column(String, nullable=True)
    refill_reminder_days = Column(Integer, server_default="7", nullable=False)
    scripts_low_threshold = Column(Integer, server_default="2", nullable=False)

    account = relationship("Account", back_populates="notification_preference")
