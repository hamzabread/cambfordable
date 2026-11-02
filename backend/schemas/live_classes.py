from datetime import datetime
from pydantic import BaseModel, Field, field_validator


class LiveClassBase(BaseModel):
    course_id: int
    title: str = Field(min_length=1, max_length=200)
    starts_at: datetime
    # Matches the form: 15 minutes to 8 hours.
    duration: int = Field(default=60, ge=15, le=480)

    @field_validator("title", mode="before")
    @classmethod
    def strip_title(cls, value):
        return str(value or "").strip()


    class Config:
        from_attributes = True

class LiveClassJoin(BaseModel):
    meeting_id: str
    signature: str
    sdk_key: str
    user_name: str
    starts_at: datetime
    password: str | None = None
    role: int = 0

    class Config:
        from_attributes = True



class LiveClassCreate(LiveClassBase):
    pass #meeting_id will be created automatically

class LiveClassOut(BaseModel):
    id: int
    title: str
    course_id: int
    starts_at: datetime
    ends_at: datetime
    meeting_id: str
    join_url: str
    start_url: str | None = None
    attachment_url: str | None = None
    recording_url: str | None = None
    recording_passcode: str | None = None
    # For the signed-in student, once attendance has been taken from Zoom.
    my_attendance_minutes: int | None = None
    attendance_status: str | None = None

    class Config:
        from_attributes = True


class AttendanceRow(BaseModel):
    user_id: int | None
    name: str
    username: str | None = None
    minutes: int
    status: str
    first_join: datetime | None = None
    last_leave: datetime | None = None


class ClassAttendanceOut(BaseModel):
    class_id: int
    class_minutes: int
    source: str | None = None
    synced_at: datetime | None = None
    students: list[AttendanceRow]
    # Zoom participants that couldn't be matched to an account (guests, odd names).
    unmatched: list[AttendanceRow]


class LiveClassSessionClaim(BaseModel):
    device_id: str


class LiveClassSessionStatus(BaseModel):
    active: bool
    detail: str

    class Config:
        from_attributes = True
