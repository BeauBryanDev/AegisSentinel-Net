import logging
from datetime import datetime
 
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
 
from app.models.recordings import Recording, RecordingStatus
 
logger = logging.getLogger("aegis.recordings")


# Lifecycle of stream sessions (single responsibility):
#   open : when a WebSocket connection starts
#   close  : when the connection ends (completed or error)


class RecordingService:
 
    @staticmethod
    async def open(db: AsyncSession,
                   camera_id: str | None = None,
                   user_id: int | None = None) -> Recording:
        """
        Opens a new stream session. Called when the WebSocket connects.
        """
        recording = Recording(
            camera_id=camera_id,
            user_id=user_id,
            status=RecordingStatus.ACTIVE,
        )
        db.add(recording)
        await db.flush()
        await db.refresh(recording)
        logger.info("Recording opened: id=%s camera=%s",
                    recording.id, camera_id)
        
        return recording
 
 
    @staticmethod
    async def close(db: AsyncSession,
                    recording_id: int,
                    error: bool = False) -> Recording | None:
        """
        Closes a session. Called when the WebSocket disconnects.
        Marks status as COMPLETED, or ERROR if the stream crashed.
        """
        result = await db.execute(
            
            select(Recording).where(Recording.id == recording_id)
        )
        recording = result.scalar_one_or_none()
        
        if recording is None:
            
            logger.warning("Recording %s not found on close", recording_id)
            
            return None
 
        recording.status = (
            RecordingStatus.ERROR if error else RecordingStatus.COMPLETED
        )
        recording.ended_at = datetime.utcnow()
        
        await db.flush()
        
        logger.info("Recording closed: id=%s status=%s",
                    recording.id, recording.status)
        
        return recording
 
 
    @staticmethod
    async def get_by_id(db: AsyncSession, recording_id: int) -> Recording | None:
        
        result = await db.execute(
            
            select(Recording).where(Recording.id == recording_id)
        )
        
        return result.scalar_one_or_none()
 
    @staticmethod
    async def list_recent(db: AsyncSession,
                          limit: int = 50,
                          offset: int = 0,
                          status: RecordingStatus | None = None
                          ) -> list[Recording]:
        
        query = select(Recording).order_by(desc(Recording.started_at))
        
        if status is not None:
            
            query = query.where(Recording.status == status)
            
        query = query.limit(limit).offset(offset)
        
        result = await db.execute(query)
        
        return list(result.scalars().all())
    
    