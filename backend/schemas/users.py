from pydantic import BaseModel, EmailStr
from typing import Optional

class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr

    class Config:
        from_attributes = True

class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: Optional[str] = None

    class Config:
        from_attributes = True

class UserCreate(UserBase):
    password: str


class UserMe(UserBase):
    id: int
    is_admin: bool

