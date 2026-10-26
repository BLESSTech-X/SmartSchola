from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None
    school_id: Optional[int] = None
    school_slug: Optional[str] = None


class UserLogin(BaseModel):
    username: str = Field(min_length=1, max_length=320)
    password: str = Field(min_length=1, max_length=256)
    school_slug: str = Field(min_length=1, max_length=100)
    role: str = Field(min_length=1, max_length=30)


class UserBase(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=1, max_length=160)
    role: str = "student"


class UserCreate(UserBase):
    password: str = Field(min_length=10, max_length=128)


class UserOut(UserBase):
    id: int
    created_at: datetime
    school_id: Optional[int] = None
    school_slug: Optional[str] = None
    school_name: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class PublicSchool(BaseModel):
    id: int
    name: str
    slug: str
    location: str
    model_config = ConfigDict(from_attributes=True)


class PasswordResetRequest(BaseModel):
    token: str = Field(min_length=32, max_length=256)
    new_password: str = Field(min_length=10, max_length=128)


class UnblockAccountRequest(BaseModel):
    school_slug: str = Field(min_length=1, max_length=100)
    user_email: EmailStr
