import logging
from typing import Optional
 
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
 
from app.core.database import get_db
from app.models.detections import AlertLevel
from app.schemas.detections import DetectionRead, DetectionSummary
from app.services.detection_service import DetectionService
 
 
router = APIRouter(prefix="/api/v1/detections", tags=["detections"])
logger = logging.getLogger("aegis.routers.detections")
 

@router.get("/", response_model=list[DetectionSummary])
async def list_detections(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    alert_level: Optional[AlertLevel] = None,
    recording_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Dashboard main feed: latest detections with lightweight payload.
    Excludes heavy fields (attention, pose_data, snapshot).
    """
    detections = await DetectionService.list_recent(
        db,
        limit=limit,
        offset=offset,
        alert_level=alert_level,
        recording_id=recording_id,
    )
    return detections
 
 
@router.get("/{detection_id}", response_model=DetectionRead)
async def get_detection(
    detection_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    Full detail of a single detection including attention weights,
    weapons_data and pose_data. Used when user clicks on an alert.
    """
    detection = await DetectionService.get_by_id(db, detection_id)
    
    if detection is None:
        
        raise HTTPException(status_code=404, detail="Detection not found")
    
    return detection

