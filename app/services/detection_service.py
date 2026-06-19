import logging
 
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
 
from app.models.detections import AlertLevel, Detection
from app.schemas.detections import DetectionCreate
 
 
logger = logging.getLogger("aegis.detections")

_ALERT_RANK = {
    AlertLevel.LOW: 0,
    AlertLevel.MEDIUM: 1,
    AlertLevel.HIGH: 2,
    AlertLevel.CRITICAL: 3,
}

# Detections are created ONLY by the vision pipeline (stream
# router). There is no update/delete exposed NOT CRUD. They are
# immutable audit records.


class DetectionService:
    """
    CRUD operations for Detection records.
    - create() is called from the stream router when should_persist() is True.
    - get_by_id() and list_recent() are called from the dashboard router.
    No update/delete: detections are immutable audit records.
    """
    #Read create only. Detections are immutable.*
 
    @staticmethod  # no self, all methods are static
    async def create(db: AsyncSession, data: DetectionCreate) -> Detection:
        """
        Persists a detection produced by the inference pipeline.
        Called from the stream router when should_persist() is True.
        """
        detection = Detection(**data.model_dump())
        
        db.add(detection)
        await db.flush()          # get the id without committing
        
        await db.refresh(detection)
        
        logger.debug("Detection persisted: id=%s type=%s",
                     detection.id, detection.detection_type)
        
        return detection
 
 
    @staticmethod
    async def get_by_id(db: AsyncSession, detection_id: int) -> Detection | None:
        result = await db.execute(
            select(Detection).where(Detection.id == detection_id)
        )
        
        return result.scalar_one_or_none()
 
 
    @staticmethod
    async def list_recent(db: AsyncSession,
                          limit: int = 50,
                          offset: int = 0,
                          alert_level: AlertLevel | None = None,
                          recording_id: int | None = None) -> list[Detection]:
        """
        Dashboard main query: latest detections, optionally filtered
        by alert level or recording session.
        """
        query = select(Detection).order_by(desc(Detection.created_at))
 
        if alert_level is not None:
            
            query = query.where(Detection.alert_level == alert_level)
            
        if recording_id is not None:
            
            query = query.where(Detection.recording_id == recording_id)
 
        query = query.limit(limit).offset(offset)
        
        result = await db.execute(query)
        
        return list(result.scalars().all())
 
 
    @staticmethod
    async def count_by_recording(db: AsyncSession, recording_id: int) -> int:
        
        from sqlalchemy import func
        
        result = await db.execute(

            select(func.count(Detection.id))
            .where(Detection.recording_id == recording_id)
        )
        return result.scalar() or 0


    @staticmethod
    async def max_alert_by_recording(db: AsyncSession,
                                     recording_id: int) -> AlertLevel | None:
        """
        Highest alert level reached during a recording session.
        Used by the recording detail view (session summary badge).
        """
        result = await db.execute(
            select(Detection.alert_level)
            .where(Detection.recording_id == recording_id)
            .distinct()
        )
        levels = result.scalars().all()
        if not levels:
            return None

        return max(levels, key=lambda level: _ALERT_RANK[level])


 