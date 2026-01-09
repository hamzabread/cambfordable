from datetime import datetime
from pydantic import BaseModel


class LiveClassBase(BaseModel):
    course_id: int
    title: str
    starts_at: datetime
    duration: int = 60
    

    class Config:
        from_attributes = True

class LiveClassJoin(BaseModel):
    meeting_id: str
    signature: str
    sdk_key: str
    user_name: str
    starts_at: datetime

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
    start_url: str

    class Config:
        from_attributes = True
