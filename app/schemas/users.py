# AegisSentinel-Net — users.py
from datetime import datetime
from typing import Optional
 
from pydantic import BaseModel, ConfigDict, EmailStr, Field
 
 
class UserBase(BaseModel):
    name: str = Field(..., max_length=100)
    username: str = Field(..., max_length=50)
    email: EmailStr
    gender: Optional[str] = Field(None, max_length=20)
    phone_number: Optional[str] = Field(None, max_length=30)
    city: Optional[str] = Field(None, max_length=100)
    country: Optional[str] = Field(None, max_length=100)
    address: Optional[str] = Field(None, max_length=255)
 
 
 
class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=128)
 
 
class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = Field(None, max_length=30)
    city: Optional[str] = Field(None, max_length=100)
    country: Optional[str] = Field(None, max_length=100)
    address: Optional[str] = Field(None, max_length=255)
 
 
 
class UserRead(UserBase):
    model_config = ConfigDict(from_attributes=True)
 
    id: int
    is_active: bool
    is_admin: bool
    created_at: datetime
    updated_at: datetime
    

class UserInDBBase(UserBase):
    id: int


class UserInDBCreate(UserInDBBase):
    password: str = Field(..., min_length=8, max_length=128)


class UserInDBUpdate(UserInDBBase):
    name: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = Field(None, max_length=30)
    city: Optional[str] = Field(None, max_length=100)
    country: Optional[str] = Field(None, max_length=100)
    address: Optional[str] = Field(None, max_length=255)        
    

