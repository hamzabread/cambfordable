from pydantic import BaseModel
from typing import Optional, List

class AnswerSubmit(BaseModel):
    question_id: int
    selected_option_id: Optional[int] = None
    uploaded_file_url: Optional[str] = None

class QuizSubmit(BaseModel):
    quiz_id: int
    answers: List[AnswerSubmit]
    tab_switches: Optional[int] = 0
    fullscreen_exits: Optional[int] = 0
    auto_submitted: Optional[bool] = False

class GradeQuiz(BaseModel):
    submission_id: int
    score: int
