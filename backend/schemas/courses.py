from pydantic import BaseModel
from datetime import datetime

class CourseOut(BaseModel):
    id: int
    name: str
    code: str

    class Config:
        from_attributes = True

class CourseCreate(BaseModel):
    name: str
    code: str

class EnrolledCourseBase(CourseOut):
    progress: int
    completed: int


class CoursePaymentStatusOut(BaseModel):
    course_id: int
    course_name: str
    paid_at: datetime
    expires_at: datetime
    days_remaining: int   # whole days left before the subscription lapses
    reminder: bool        # true once the student should be warned (<= 2 days left)
