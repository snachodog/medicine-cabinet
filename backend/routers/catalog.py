# backend/routers/catalog.py
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from .. import crud, schemas, database
from ..auth import get_current_account

router = APIRouter(prefix="/catalog", tags=["catalog"])


@router.get("", response_model=List[schemas.CatalogEntryResponse])
def search_catalog(
    q: Optional[str] = Query(None, description="Filter by name"),
    db: Session = Depends(database.get_db),
    _account=Depends(get_current_account),
):
    return crud.search_catalog(db, q=q)
