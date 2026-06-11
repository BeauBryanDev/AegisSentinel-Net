from __future__ import annotations

import enum
from datetime import datetime
from typing import Optional
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func

from app.core.database import Base

if TYPE_CHECKING:
    
    from app.models.recordings import Recording
    from app.models.detections import Detection
    from app.models.users import User

class WeaponType(str, enum.Enum):
    KNIFE  = "knife"
    GUN    = "gun"
    RIFLE = "rifle"
    
    
class Weapon(Base):
    __tablename__ = "weapons"
 
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    recording_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("recordings.id", ondelete="SET NULL"), nullable=True, index=True)
    detection_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("detections.id", ondelete="SET NULL"), nullable=True, index=True)
    user_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)

    weapon_type: Mapped[WeaponType] = mapped_column(Enum(WeaponType, name="weapon_type_enum"), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    camera_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)

    detected_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())

    recording: Mapped["Recording"] = relationship("Recording", back_populates="weapons")
    detection: Mapped["Detection"] = relationship("Detection", back_populates="weapons")
    user: Mapped["User"] = relationship("User", back_populates="weapons")
 
 
    def __repr__(self) -> str:
        
        return (
            f"<Weapon(id={self.id}, type='{self.weapon_type}', "
            f"detected_at={self.detected_at})>"
        )   