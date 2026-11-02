from pydantic import BaseModel
from datetime import datetime

class LiveChatMessageBase(BaseModel):
    message: str

class LiveChatMessageOut(BaseModel):
    id: int
    live_class_id: int
    user_id: int
    message: str
    created_at: datetime
    is_admin: bool
    sender_name: str

    class Config:
        from_attributes = True
