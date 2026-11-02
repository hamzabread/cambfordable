import re
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

USERNAME_PATTERN = re.compile(r"^[A-Za-z0-9_.-]{3,30}$")
PHONE_PATTERN = re.compile(r"^\+[1-9][0-9]{7,14}$")


def normalize_phone(value: str) -> str:
    """Accept spaces and dashes for readability; store +923001234567."""
    compact = re.sub(r"[\s-]", "", value)
    if not compact.startswith("+"):
        raise ValueError("Phone number must start with + and the country code, for example +923001234567")
    if not PHONE_PATTERN.match(compact):
        raise ValueError("Phone number must be 8 to 15 digits after the country code +, for example +923001234567")
    return compact


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
    full_name: str = Field(min_length=2, max_length=120)
    password: str = Field(min_length=8, max_length=128)
    phone_number: str

    @field_validator("username", mode="before")
    @classmethod
    def validate_username(cls, value):
        value = str(value or "").strip()
        if not USERNAME_PATTERN.match(value):
            raise ValueError("Username must be 3 to 30 characters: letters, numbers, dots, dashes or underscores")
        return value

    @field_validator("email", mode="before")
    @classmethod
    def lowercase_email(cls, value):
        return str(value or "").strip().lower()

    @field_validator("full_name", mode="before")
    @classmethod
    def strip_full_name(cls, value):
        return " ".join(str(value or "").split())

    @field_validator("phone_number", mode="before")
    @classmethod
    def validate_phone(cls, value):
        return normalize_phone(str(value or "").strip())


class UserMe(UserBase):
    id: int
    is_admin: bool
    is_ta: bool
    payment: bool = False
    phone_number: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    nationality: Optional[str] = None
    permanent_address: Optional[str] = None
    student_id: Optional[str] = None
    major: Optional[str] = None
    current_year: Optional[str] = None
    academic_standing: Optional[str] = None
    created_at: Optional[datetime] = None


class AcademicProfileUpdate(BaseModel):
    student_id: Optional[str] = Field(default=None, max_length=80)
    major: Optional[str] = Field(default=None, max_length=160)
    current_year: Optional[str] = Field(default=None, max_length=80)
    academic_standing: Optional[str] = Field(default=None, max_length=80)

    @field_validator("student_id", "major", "current_year", "academic_standing", mode="before")
    @classmethod
    def normalize_optional_text(cls, value):
        if value is None:
            return None
        value = str(value).strip()
        return value or None


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=2, max_length=120)
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = Field(default=None, max_length=32)
    date_of_birth: Optional[date] = None
    gender: Optional[str] = Field(default=None, max_length=40)
    nationality: Optional[str] = Field(default=None, max_length=80)
    permanent_address: Optional[str] = Field(default=None, max_length=500)

    @field_validator(
        "full_name",
        "phone_number",
        "gender",
        "nationality",
        "permanent_address",
        mode="before",
    )
    @classmethod
    def normalize_optional_text(cls, value):
        if value is None:
            return None
        value = str(value).strip()
        return value or None

    @field_validator("phone_number")
    @classmethod
    def validate_phone_number(cls, value: Optional[str]):
        return value if value is None else normalize_phone(value)

    @field_validator("email", mode="before")
    @classmethod
    def lowercase_email(cls, value):
        return value if value is None else str(value).strip().lower()

    @field_validator("date_of_birth")
    @classmethod
    def validate_date_of_birth(cls, value: Optional[date]):
        if value is not None and value >= date.today():
            raise ValueError("Date of birth must be in the past")
        return value


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class PasswordReset(BaseModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)

