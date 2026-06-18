import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.events import EventSeverity, EventType
from app.schemas.events import EventRead, EventUpdate
from app.services.event_service import EventService


router = APIRouter(prefix="/api/v1/events", tags=["events"])
logger = logging.getLogger("aegis.routers.events")


@router.get("/", response_model=list[EventRead])
async def list_events(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    event_type: Optional[EventType] = None,
    severity: Optional[EventSeverity] = None,
    recording_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Dashboard incident feed: latest events (fight/weapon/contact/system),
    most recent first.
    """
    events = await EventService.list_recent(
        db,
        limit=limit,
        offset=offset,
        event_type=event_type,
        severity=severity,
        recording_id=recording_id,
    )
    return events


@router.get("/{event_id}", response_model=EventRead)
async def get_event(
    event_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Full detail of a single event. Used when user clicks on an incident."""
    event = await EventService.get_by_id(db, event_id)
    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")

    return event


@router.patch("/{event_id}", response_model=EventRead)
async def update_event(
    event_id: int,
    data: EventUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Closes an open event (sets ended_at) or edits description/severity."""
    event = await EventService.update(db, event_id, data)
    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")

    await db.commit()
    return event
