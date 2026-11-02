from datetime import datetime

from pydantic import BaseModel, Field, field_validator
from typing import Literal, Optional


def _clean_link(value):
    value = str(value or "").strip()
    if not value:
        return None
    if not value.startswith("https://"):
        raise ValueError("must start with https://")
    return value


class CourseOut(BaseModel):
    id: int
    name: str
    code: str

    class Config:
        from_attributes = True


class CourseAdminOut(CourseOut):
    whatsapp_invite_link: Optional[str] = None
    archived_at: Optional[datetime] = None
    # Shown before a delete, so the admin knows what goes with the course.
    student_count: int = 0
    class_count: int = 0


class CourseCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    code: str = Field(min_length=1, max_length=30)
    # Shared with students in the welcome email once their enrollment is
    # approved. Can be changed later with PATCH /courses/{id}.
    whatsapp_invite_link: Optional[str] = Field(default=None, max_length=300)

    @field_validator("name", "code", mode="before")
    @classmethod
    def strip_text(cls, value):
        return " ".join(str(value or "").split())

    @field_validator("whatsapp_invite_link", mode="before")
    @classmethod
    def clean_link(cls, value):
        return _clean_link(value)


class CourseUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=120)
    whatsapp_invite_link: Optional[str] = Field(default=None, max_length=300)

    @field_validator("name", mode="before")
    @classmethod
    def strip_name(cls, value):
        return None if value is None else " ".join(str(value).split())

    @field_validator("whatsapp_invite_link", mode="before")
    @classmethod
    def clean_link(cls, value):
        return _clean_link(value)


class EnrolledCourseBase(CourseOut):
    progress: int
    completed: int


class CourseCatalogItem(CourseOut):
    enrollment_status: Literal["available", "pending", "rejected", "enrolled", "paused"]
    archived: bool = False
    progress: int = 0
    completed: int = 0
    rejection_reason: Optional[str] = None
    # Monthly billing
    paid_until: Optional[datetime] = None
    overdue: bool = False
    pauses_on: Optional[datetime] = None
    removal_on: Optional[datetime] = None
    renewal_open: bool = False
    proof_pending: bool = False
