from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None


class UserLogin(BaseModel):
    # The existing frontend calls this field "username"; it must contain an email.
    username: EmailStr
    password: str = Field(min_length=1, max_length=256)


class UserBase(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=1, max_length=160)
    role: str = "student"


class UserCreate(UserBase):
    password: str = Field(min_length=10, max_length=128)


class UserOut(UserBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
