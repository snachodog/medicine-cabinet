# backend/routers/calendar.py
import secrets
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from icalendar import Calendar, Event, vDate
from sqlalchemy.orm import Session

from .. import crud, schemas, database
from ..auth import get_current_account

router = APIRouter(prefix="/calendar", tags=["calendar"])


def _build_calendar(db: Session, account) -> bytes:
    """Build an ICS calendar for all prescriptions accessible to this account."""
    pref = crud.get_or_create_notification_pref(db, account.id)
    reminder_days = pref.refill_reminder_days

    persons = crud.get_accessible_persons(db, account.id)

    cal = Calendar()
    cal.add("prodid", "-//Medicine Cabinet//medicine-cabinet//EN")
    cal.add("version", "2.0")
    cal.add("calscale", "GREGORIAN")
    cal.add("X-WR-CALNAME", "Medicine Cabinet — Refills")

    for person in persons:
        meds = crud.get_medications_for_person(db, person.id, active_only=True)
        for med in meds:
            rx = med.prescription
            if rx is None or rx.next_eligible_date is None:
                continue

            pickup_date = rx.next_eligible_date
            summary_base = f"{med.name} ({person.name})"

            # Pickup event on next_eligible_date
            pickup = Event()
            pickup.add("uid", f"pickup-{rx.id}@medicine-cabinet")
            pickup.add("summary", f"Pick up: {summary_base}")
            pickup.add("dtstart", vDate(pickup_date))
            pickup.add("dtend", vDate(pickup_date + timedelta(days=1)))
            if rx.pharmacy:
                pickup.add("location", rx.pharmacy)
            if rx.scripts_remaining is not None:
                pickup.add("description", f"Scripts remaining after pickup: {max(0, rx.scripts_remaining - 1)}")
            cal.add_component(pickup)

            # Refill reminder N days before pickup
            reminder_date = pickup_date - timedelta(days=reminder_days)
            reminder = Event()
            reminder.add("uid", f"refill-{rx.id}@medicine-cabinet")
            reminder.add("summary", f"Refill reminder: {summary_base}")
            reminder.add("dtstart", vDate(reminder_date))
            reminder.add("dtend", vDate(reminder_date + timedelta(days=1)))
            reminder.add("description", f"Eligible to pick up on {pickup_date.strftime('%B %d, %Y')}")
            cal.add_component(reminder)

    return cal.to_ical()


@router.get("/feed.ics")
def download_calendar(
    db: Session = Depends(database.get_db),
    account=Depends(get_current_account),
):
    """Download a one-time ICS snapshot (requires session cookie)."""
    ics_bytes = _build_calendar(db, account)
    return Response(
        content=ics_bytes,
        media_type="text/calendar",
        headers={"Content-Disposition": 'attachment; filename="medicine_cabinet.ics"'},
    )


@router.get("/subscribe.ics")
def subscribe_calendar(
    token: str = Query(...),
    db: Session = Depends(database.get_db),
):
    """Subscribable ICS feed authenticated by a calendar token (no session cookie needed)."""
    pref = crud.get_pref_by_calendar_token(db, token)
    if pref is None:
        raise HTTPException(status_code=401, detail="Invalid calendar token")
    account = crud.get_account_by_id(db, pref.account_id)
    if account is None or not account.is_active:
        raise HTTPException(status_code=401, detail="Invalid calendar token")
    ics_bytes = _build_calendar(db, account)
    return Response(content=ics_bytes, media_type="text/calendar")


@router.post("/token", response_model=schemas.CalendarTokenResponse)
def generate_calendar_token(
    db: Session = Depends(database.get_db),
    account=Depends(get_current_account),
):
    """Generate (or regenerate) a long-lived calendar token for the subscribe URL."""
    token = secrets.token_urlsafe(32)
    crud.set_calendar_token(db, account.id, token)
    return schemas.CalendarTokenResponse(
        token=token,
        subscribe_url=f"/api/calendar/subscribe.ics?token={token}",
    )
