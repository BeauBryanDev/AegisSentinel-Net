import enum
 
from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
 
from app.core.database import Base
 
class RecordingStatus(str, enum.Enum):
    
    ACTIVE    = "active"
    COMPLETED = "completed"
    ERROR     = "error"
    
    
class Recording(Base):
    
    __tablename__ = "recordings"
 
    id         = Column(Integer, primary_key=True, autoincrement=True)
    user_id    = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    camera_id  = Column(String(64), nullable=True)
    status     = Column(Enum(RecordingStatus, name="recording_status_enum"), nullable=False, default=RecordingStatus.ACTIVE
                        )
    started_at = Column(DateTime, nullable=False, server_default=func.now())
    ended_at   = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    
 
    user       = relationship("User", back_populates="recordings")
    detections = relationship("Detection", back_populates="recording", cascade="all, delete-orphan")
    events     = relationship("Event", back_populates="recording", cascade="all, delete-orphan")
    
    
 
    def __repr__(self) -> str:
        return (
            f"<Recording(id={self.id}, user_id={self.user_id}, "
            f"status='{self.status}', started_at={self.started_at})>"
        )
 
 