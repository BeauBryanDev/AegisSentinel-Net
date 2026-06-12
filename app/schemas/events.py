from datetime import datetime
from typing import Optional
 
from pydantic import BaseModel, ConfigDict, Field
 
from app.models.events import EventSeverity, EventType
 
 
#  Input schemas
 
class EventCreate(BaseModel):
    """
    Created by alert_service when consecutive detections
    consolidate into a meaningful incident.
    """
    recording_id: Optional[int] = None
    detection_id: Optional[int] = None
    user_id: Optional[int] = None
 
    event_type: EventType
    severity: EventSeverity = EventSeverity.MEDIUM
    description: Optional[str] = None
    camera_id: Optional[str] = Field(None, max_length=64)
 
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
 
 
class EventUpdate(BaseModel):
    """Closes an open event (sets ended_at) or edits description."""
    ended_at: Optional[datetime] = None
    description: Optional[str] = None
    severity: Optional[EventSeverity] = None
 
 
#  - Output schemas  
 
class EventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
 
    id: int
    recording_id: Optional[int]
    detection_id: Optional[int]
    user_id: Optional[int]
 
    event_type: EventType
    severity: EventSeverity
    description: Optional[str]
    camera_id: Optional[str]
 
    started_at: datetime
    ended_at: Optional[datetime]
    created_at: datetime