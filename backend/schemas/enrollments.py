# schemas/enrollments.py
from pydantic import BaseModel

class AdminEnrollRequest(BaseModel):
    user_id: int
    course_id: int
