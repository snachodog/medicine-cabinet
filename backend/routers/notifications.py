# backend/routers/notifications.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import crud, schemas, database
from ..auth import get_current_account

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/preferences", response_model=schemas.NotificationPrefResponse)
def get_preferences(
    db: Session = Depends(database.get_db),
    account=Depends(get_current_account),
):
    return crud.get_or_create_notification_pref(db, account.id)


@router.patch("/preferences", response_model=schemas.NotificationPrefResponse)
def update_preferences(
    payload: schemas.NotificationPrefUpdate,
    db: Session = Depends(database.get_db),
    account=Depends(get_current_account),
):
    return crud.update_notification_pref(db, account.id, payload)
