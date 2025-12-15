from datetime import datetime
from pydantic import BaseModel


class LiveClassBase(BaseModel):
    course_id: int
    title: str
    starts_at: datetime
    ends_at: datetime

    class Config:
        from_attributes = True

class LiveClassJoin(BaseModel):
    zoom_url: str
    starts_at: datetime
    class Config:
        from_attributes = True


class LiveClassCreate(LiveClassBase):
    meeting_url: str

class LiveClassOut(LiveClassBase):
    id: int
    meeting_url: str
    is_live: bool

    class Config:
        from_attributes = True
