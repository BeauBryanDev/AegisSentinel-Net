import logging
from typing import Optional
 
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
 
from app.core.database import get_db
from app.models.recordings import RecordingStatus
from app.schemas.recordings import RecordingRead, RecordingWithStats
from app.services.detection_service import DetectionService
from app.services.event_service import EventService
from app.services.recording_service import RecordingService
 
 
router = APIRouter(prefix="/api/v1/recordings", tags=["recordings"])
logger = logging.getLogger("aegis.routers.recordings")
 
 
@router.get("/", response_model=list[RecordingRead])
async def list_recordings(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    status: Optional[RecordingStatus] = None,
    db: AsyncSession = Depends(get_db),
):
    """List stream sessions, most recent first."""
    recordings = await RecordingService.list_recent(
        db, limit=limit, offset=offset, status=status,
    )
    return recordings
 
 
@router.get("/{recording_id}", response_model=RecordingWithStats)
async def get_recording(
    recording_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    Single recording with aggregate stats.
    Dashboard uses this when user opens a session detail view.
    """
    recording = await RecordingService.get_by_id(db, recording_id)
    
    if recording is None:
        
        raise HTTPException(status_code=404, detail="Recording not found")
 
    total_detections = await DetectionService.count_by_recording(
        db, recording_id,
    )
    total_events = await EventService.count_by_recording(
        db, recording_id,
    )
    max_alert_level = await DetectionService.max_alert_by_recording(
        db, recording_id,
    )

    return RecordingWithStats(
        id=recording.id,
        user_id=recording.user_id,
        camera_id=recording.camera_id,
        status=recording.status,
        started_at=recording.started_at,
        ended_at=recording.ended_at,
        created_at=recording.created_at,
        total_detections=total_detections,
        total_events=total_events,
        max_alert_level=max_alert_level,
    )
 
 
 