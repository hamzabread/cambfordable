from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class HomeworkBase(BaseModel):
    course_id: int
    title: str
    description: Optional[str] = None
    due_date: datetime

    class Config:
        from_attributes = True

class HomeworkCreate(HomeworkBase):
    pass

class HomeworkOut(HomeworkBase):
    id: int

class HomeworkSubmissionCreate(BaseModel):
    file_url: str  # Could be uploaded via a file server or S3

class HomeworkSubmissionOut(BaseModel):
    id: int
    homework_id: int
    user_id: int
    file_url: str
    submitted_at: datetime
