from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean
from sqlalchemy.sql import func
from app.core.database import Base
from sqlalchemy.orm import relationship


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    name = Column(String(100), nullable=False)
    username = Column(String(50), unique=True, index=True, nullable=False)
    gender = Column(String(20), nullable=True)         
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone_number = Column(String(30), nullable=True)
    city = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True)
    address = Column(String(255), nullable=True)
    
    hashed_password = Column(String(255), nullable=False)
    
    is_active = Column(Boolean, default=True, nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now()
    )
    
    recordings = relationship("Recording", back_populates="user")
    detections = relationship("Detection", back_populates="user")
    events     = relationship("Event",     back_populates="user")
    
    

    def __repr__(self) -> str:
        return (
            f"<User(id={self.id}, "
            f"username='{self.username}', "
            f"email='{self.email}', "
            f"is_active={self.is_active}, "
            f"is_admin={self.is_admin}, "
            f"created_at={self.created_at})>"
        )
        
