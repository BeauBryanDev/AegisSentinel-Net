from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.weapons import WeaponType


# Input schemas

class WeaponCreate(BaseModel):
    """Payload to create a weapon detection record."""
    recording_id: Optional[int] = None
    detection_id: Optional[int] = None
    user_id: Optional[int] = None

    weapon_type: WeaponType
    description: Optional[str] = None
    camera_id: Optional[str] = Field(None, max_length=64)

    detected_at: datetime


# Output schemas


class WeaponRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    recording_id: Optional[int]
    detection_id: Optional[int]
    user_id: Optional[int]

    weapon_type: WeaponType
    description: Optional[str]
    camera_id: Optional[str]

    detected_at: datetime
    created_at: datetime

