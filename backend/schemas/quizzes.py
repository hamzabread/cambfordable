from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class OptionCreate(BaseModel):
    option_text: str
    is_correct: bool

class QuestionCreate(BaseModel):
    question_text: str
    is_mcq: bool
    marks: int
    options: Optional[List[OptionCreate]] = None  # Only for MCQs

class QuizCreate(BaseModel):
    course_id: int
    title: str
    total_marks: int
    deadline: Optional[datetime] = None       # 🔹 add this
    allow_late: bool = False  
    questions: List[QuestionCreate]
