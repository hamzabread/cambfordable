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
