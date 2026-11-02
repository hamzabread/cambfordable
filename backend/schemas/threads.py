from datetime import datetime

from pydantic import BaseModel, Field, field_validator


def _clean(value) -> str:
    return str(value or "").strip()


class ThreadCreate(BaseModel):
    course_id: int
    title: str = Field(min_length=3, max_length=150)
    body: str = Field(min_length=1, max_length=4000)

    @field_validator("title", mode="before")
    @classmethod
    def clean_title(cls, value):
        return " ".join(_clean(value).split())

    @field_validator("body", mode="before")
    @classmethod
    def clean_body(cls, value):
        return _clean(value)


class ReplyCreate(BaseModel):
    body: str = Field(min_length=1, max_length=4000)

    @field_validator("body", mode="before")
    @classmethod
    def clean_body(cls, value):
        return _clean(value)


class ThreadUpdate(BaseModel):
    is_resolved: bool


class ReplyOut(BaseModel):
    id: int
    author_id: int
    author_name: str
    is_staff: bool
    is_mine: bool
    body: str
    created_at: datetime


class ThreadSummary(BaseModel):
    id: int
    course_id: int
    course_name: str
    title: str
    author_id: int
    author_name: str
    is_resolved: bool
    reply_count: int
    # True while the last word is the student's: staff still need to answer.
    awaiting_staff: bool
    last_reply_preview: str
    created_at: datetime
    updated_at: datetime


class ThreadDetail(ThreadSummary):
    replies: list[ReplyOut]
    can_reply: bool
