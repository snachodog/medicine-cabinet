# backend/scheduler.py
# --------------------
# APScheduler background job: daily prescription expiry email alerts.
# Runs at 09:00 server time.  Skipped silently if SMTP is not configured.

import logging
from datetime import date, timedelta

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from .database import SessionLocal
from . import models
from .email_service import send_prescription_expiry_warning

logger = logging.getLogger(__name__)

WARN_DAYS = (7, 30)

scheduler = AsyncIOScheduler()


def _check_expiring_prescriptions() -> None:
    """Query all accounts with email alerts enabled and send reminders."""
    today = date.today()
    thresholds = {today + timedelta(days=d) for d in WARN_DAYS}

    db = SessionLocal()
    try:
        prefs = (
            db.query(models.NotificationPreference)
            .filter(models.NotificationPreference.email_enabled.is_(True))
            .all()
        )

        for pref in prefs:
            account = pref.account
            if not account or not account.email or not account.is_active:
                continue

            expiring = []
            for access in account.person_access:
                person = access.person
                for med in person.medications:
                    if not med.is_active or not med.prescription:
                        continue
                    exp = med.prescription.expiration_date
                    if exp and exp in thresholds:
                        days_left = (exp - today).days
                        expiring.append({
                            "person": person.name,
                            "name": med.name,
                            "expiration_date": exp.isoformat(),
                            "days_left": days_left,
                        })

            if expiring:
                send_prescription_expiry_warning(
                    to=account.email,
                    username=account.username,
                    expiring=expiring,
                )
    except Exception:
        logger.exception("Error during prescription expiry check")
    finally:
        db.close()


def start_scheduler() -> None:
    scheduler.add_job(
        _check_expiring_prescriptions,
        trigger="cron",
        hour=9,
        minute=0,
        id="prescription_expiry_check",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("Scheduler started")


def stop_scheduler() -> None:
    scheduler.shutdown(wait=False)
    logger.info("Scheduler stopped")
