import logging

from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.events import Event, EventSeverity, EventType
from app.schemas.events import EventCreate, EventUpdate

logger = logging.getLogger("aegis.events")


class EventService:
    """
    CRUD operations for Event records.
    - create() is called by the stream router when AlertConsolidator opens an event.
    - update() closes an open event (sets ended_at) or escalates severity.
    - get_by_id() and list_recent() are called from the dashboard router.
    """

    @staticmethod
    async def create(db: AsyncSession, data: EventCreate) -> Event:
        
        event = Event(**data.model_dump())

        db.add(event)
        await db.flush()

        await db.refresh(event)

        logger.debug("Event persisted: id=%s type=%s severity=%s",
                     event.id, event.event_type, event.severity)

        return event

    @staticmethod
    async def update(db: AsyncSession, event_id: int, data: EventUpdate) -> Event | None:
        
        event = await EventService.get_by_id(db, event_id)
        
        if event is None:
            
            return None

        for field, value in data.model_dump(exclude_unset=True).items():
            
            setattr(event, field, value)

        await db.flush()
        await db.refresh(event)

        return event

    @staticmethod
    async def get_by_id(db: AsyncSession, event_id: int) -> Event | None:
        
        result = await db.execute(
            select(Event).where(Event.id == event_id)
        )

        return result.scalar_one_or_none()

    @staticmethod
    async def list_recent(db: AsyncSession,
                          limit: int = 50,
                          offset: int = 0,
                          event_type: EventType | None = None,
                          severity: EventSeverity | None = None,
                          recording_id: int | None = None) -> list[Event]:
        """
        Dashboard incident feed: latest events, optionally filtered
        by type, severity, or recording session.
        """
        query = select(Event).order_by(desc(Event.started_at))

        if event_type is not None:
            query = query.where(Event.event_type == event_type)

        if severity is not None:
            query = query.where(Event.severity == severity)

        if recording_id is not None:
            query = query.where(Event.recording_id == recording_id)

        query = query.limit(limit).offset(offset)

        result = await db.execute(query)

        return list(result.scalars().all())

    @staticmethod
    async def count_by_recording(db: AsyncSession, recording_id: int) -> int:
        
        result = await db.execute(
            
            select(func.count(Event.id))
            .where(Event.recording_id == recording_id)
            
        )
        return result.scalar() or 0
