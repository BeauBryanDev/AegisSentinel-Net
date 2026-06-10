import enum
 
from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
 
from app.core.database import Base


class EventType(str, enum.Enum):
    
    FIGHT   = "fight"
    WEAPON  = "weapon"
    CONTACT = "contact"
    SYSTEM  = "system"   # server errors, model failures, connectivity issues
    

class EventSeverity(str, enum.Enum):
    LOW      = "low"
    MEDIUM   = "medium"
    HIGH     = "high"
    CRITICAL = "critical"
 
 

class Event(Base):
    __tablename__ = "events"
 
    id    = Column(Integer, primary_key=True, autoincrement=True)
    recording_id = Column(Integer, ForeignKey("recordings.id", ondelete="SET NULL"), nullable=True, index=True)
    detection_id = Column(Integer, ForeignKey("detections.id", ondelete="SET NULL"), nullable=True, index=True)
    user_id      = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
 
    event_type   = Column(Enum(EventType, name="event_type_enum"), nullable=False, index=True)
    severity     = Column(Enum(EventSeverity, name="event_severity_enum"), nullable=False, default=EventSeverity.MEDIUM)
    description  = Column(Text, nullable=True)
    camera_id    = Column(String(64), nullable=True)
 
    started_at   = Column(DateTime, nullable=False, server_default=func.now())
    ended_at     = Column(DateTime, nullable=True)
    created_at   = Column(DateTime, nullable=False, server_default=func.now())
 
    recording = relationship("Recording", back_populates="events")
    detection = relationship("Detection", back_populates="events")
    user      = relationship("User", back_populates="events")
 
 
    def __repr__(self) -> str:
        
        return (
            f"<Event(id={self.id}, type='{self.event_type}', "
            f"severity='{self.severity}', started_at={self.started_at})>"
        )


 
 