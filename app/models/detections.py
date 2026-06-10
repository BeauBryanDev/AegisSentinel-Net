import enum
 
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
 
from app.core.database import Base
 
 
class DetectionType(str, enum.Enum):
    """
    Primary classification of the detection event.
    A single frame can trigger multiple signals but is stored
    under the dominant detection type.
    """
    VIOLENCE = "violence"  # ViolenceDetector prob >= threshold
    WEAPON   = "weapon"   # Weapon detected, violence below threshold
    CONTACT  = "contact"   # IoU >= threshold, models not yet triggered
    NORMAL   = "normal"   # Stored only when explicitly requested for audit
 
 
class AlertLevel(str, enum.Enum):
    """
    Severity level derived from the combination of signals.
    Used by the frontend to decide the visual alert color.
    """
    LOW      = "low"   # contact only, no weapon, low violence prob
    MEDIUM   = "medium"  # violence prob >= threshold OR weapon detected
    HIGH     = "high"   # violence + weapon simultaneously
    CRITICAL = "critical"  # violence + weapon + multiple persons in contact
    
        
class Detection(Base):
    __tablename__ = "detections"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    recording_id = Column(
        Integer,
        ForeignKey("recordings.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
 
    # Which operator / user owns this detection.
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
 
    #  Detection classification 
    detection_type = Column(
        Enum(DetectionType, name="detection_type_enum"),
        nullable=False,
        index=True,
    )
    alert_level = Column(
        Enum(AlertLevel, name="alert_level_enum"),
        nullable=False,
        default=AlertLevel.LOW,
    )
 
    #  Violence model output 
    violence_confidence = Column(Float, nullable=True)
    violence_triggered  = Column(Boolean, default=False, nullable=False)
 
    attention_weights = Column(JSONB, nullable=True)
    
    
#   Weapon model output 
    weapons_data = Column(JSONB, nullable=True)
    weapon_detected = Column(Boolean, default=False, nullable=False)
    
    pose_data = Column(JSONB, nullable=True)
    persons_count  = Column(Integer, nullable=True)
    contact_iou    = Column(Float, nullable=True)
    
    # Frame Context on video stream 
    # TODO: add camera_id to the stream source  
    camera_id = Column(String(64), nullable=True, index=True)
    # Timestamp of the frame captured by the camera.
    frame_time = Column(DateTime, nullable=False, index=True)
    # Frame number in the recording.
    frame_number = Column(Integer, nullable=False, index=True)
    
    #Snapshot of the frame captured by the camera.
    snapshot = Column(Text, nullable=True)
    
    created_at = Column(DateTime, nullable=False, default=func.now() , index=True)
    
    # Relationships
    recording = relationship("Recording", back_populates="detections")
    user = relationship("User", back_populates="detections")
    events = relationship("Event", back_populates="detections", cascade="all, delete-orphan")
    
    
    def __repr__(self) -> str:
        
        return (
            f"<Detection("
            f"id={self.id}, "
            f"type='{self.detection_type}', "
            f"alert='{self.alert_level}', "
            f"violence_conf={self.violence_confidence}, "
            f"weapon={self.weapon_detected}, "
            f"persons={self.persons_count}, "
            f"camera='{self.camera_id}', "
            f"created_at={self.created_at}"
            f")>"
        )
        