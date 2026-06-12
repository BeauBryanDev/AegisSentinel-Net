from datetime import datetime
from typing import Optional
 
from pydantic import BaseModel, ConfigDict, Field
 
from app.models.recordings import RecordingStatus
 
 
#  Input schemas
 
class RecordingCreate(BaseModel):
    """Opens a new stream session."""
    user_id: Optional[int] = None
    camera_id: Optional[str] = Field(None, max_length=64)
 
 
class RecordingUpdate(BaseModel):
    """Closes or updates a session (e.g. mark as completed)."""
    status: Optional[RecordingStatus] = None
    ended_at: Optional[datetime] = None
 
 
#  Output schemas
 
class RecordingRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
 
    id: int
    user_id: Optional[int]
    camera_id: Optional[str]
    status: RecordingStatus
    started_at: datetime
    ended_at: Optional[datetime]
    created_at: datetime
 
 
class RecordingWithStats(RecordingRead):
    """
    Recording enriched with aggregate counters for the dashboard.
    Computed in the service layer, not stored in the table.
    """
    total_detections: int = 0
    total_events: int = 0
    max_alert_level: Optional[str] = None
 