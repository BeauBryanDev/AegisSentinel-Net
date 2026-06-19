

from datetime import datetime
from typing import Any, Optional
 
from pydantic import BaseModel, ConfigDict, Field
 
from app.models.detections import AlertLevel, DetectionType
 
 # Input schemas
 
class DetectionCreate(BaseModel):
    """
    Payload to persist a detection coming from the inference engine.
    Built internally by detection_service, not by external clients.
    """
    recording_id: Optional[int] = None
    user_id: Optional[int] = None
 
    detection_type: DetectionType
    alert_level: AlertLevel = AlertLevel.LOW
 
    violence_confidence: Optional[float] = Field(None, ge=0.0, le=1.0)
    violence_triggered: bool = False
    attention_weights: Optional[list[float]] = None
 
    weapons_data: Optional[dict[str, Any]] = None
    weapon_detected: bool = False
 
    pose_data: Optional[dict[str, Any]] = None
    persons_count: Optional[int] = Field(None, ge=0)
    contact_iou: Optional[float] = Field(None, ge=0.0, le=1.0)
 
    camera_id: Optional[str] = Field(None, max_length=64)
    frame_time: datetime
    frame_number: int = Field(..., ge=0)
    snapshot: Optional[str] = None
 
 
#  Output schemas  
 
class DetectionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
 
    id: int
    recording_id: Optional[int]
    user_id: Optional[int]
 
    detection_type: DetectionType
    alert_level: AlertLevel
 
    violence_confidence: Optional[float]
    violence_triggered: bool
    attention_weights: Optional[list[float]]
 
    weapons_data: Optional[dict[str, Any]]
    weapon_detected: bool
 
    pose_data: Optional[dict[str, Any]]
    persons_count: Optional[int]
    contact_iou: Optional[float]
 
    camera_id: Optional[str]
    frame_time: datetime
    frame_number: int
    snapshot: Optional[str]
 
    created_at: datetime
 
 
class DetectionSummary(BaseModel):
    """
    Lightweight version for dashboard lists.
    Excludes heavy JSON fields (pose_data, snapshot, attention).
    """
    model_config = ConfigDict(from_attributes=True)
 
    id: int
    detection_type: DetectionType
    alert_level: AlertLevel
    violence_confidence: Optional[float]
    weapon_detected: bool
    persons_count: Optional[int]
    camera_id: Optional[str]
    frame_time: datetime
    created_at: datetime


