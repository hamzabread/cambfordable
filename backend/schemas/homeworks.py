from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional

class HomeworkBase(BaseModel):
    course_id: int
    title: str
    description: Optional[str] = None
    max_score: float = Field(default=100, gt=0)
    image_url: Optional[str] = None
    due_date: datetime
    solution_url: Optional[str] = None

    class Config:
        from_attributes = True

class HomeworkCreate(HomeworkBase):
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=5000)

    @field_validator("title", mode="before")
    @classmethod
    def strip_title(cls, value):
        return str(value or "").strip()

    @field_validator("due_date")
    @classmethod
    def require_timezone(cls, value: datetime):
        if value.tzinfo is None:
            raise ValueError("must include a timezone")
        return value

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
    graded_at: Optional[datetime] = None
    remark: Optional[str]
    score: Optional[float]

    class Config:
        from_attributes = True

class HomeworkSubmissionDetail(HomeworkSubmissionOut):
    student_name: str
    student_username: str
    student_email: Optional[str] = None
    is_late: bool = False


class HomeworkGrade(BaseModel):
    submission_id: int
    score: Optional[float] = None
    remark: Optional[str] = None
