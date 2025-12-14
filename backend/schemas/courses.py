from pydantic import BaseModel
from datetime import datetime

class CourseOut(BaseModel):
    id: int
    name: str
    code: str
    progress: int
    completed: int

    class Config:
        from_attributes = True
