# backend/routers/audit.py
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from .. import crud, schemas, database
from ..auth import get_current_account

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("", response_model=List[schemas.AuditLogResponse])
def list_audit_logs(
    entity_type: Optional[str] = Query(None),
    entity_id: Optional[int] = Query(None),
    limit: int = Query(100, le=500),
    db: Session = Depends(database.get_db),
    _account=Depends(get_current_account),
):
    logs = crud.get_audit_logs(db, entity_type=entity_type, entity_id=entity_id, limit=limit)
    result = []
    for log in logs:
        result.append(schemas.AuditLogResponse(
            id=log.id,
            timestamp=log.timestamp,
            account_id=log.account_id,
            username=log.account.username if log.account else None,
            entity_type=log.entity_type,
            entity_id=log.entity_id,
            action=log.action,
            detail=log.detail,
        ))
    return result
