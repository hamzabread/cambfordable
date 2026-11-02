from pydantic import BaseModel, Field, field_validator, model_validator
from typing import List, Optional
from datetime import datetime

class OptionCreate(BaseModel):
    option_text: str
    is_correct: bool

    @field_validator("option_text", mode="before")
    @classmethod
    def strip_text(cls, value):
        return str(value or "").strip()


class QuestionCreate(BaseModel):
    question_text: str = Field(min_length=1, max_length=2000)
    is_mcq: bool
    marks: int = Field(gt=0, le=1000)
    image_url: Optional[str] = None
    options: Optional[List[OptionCreate]] = None  # Only for MCQs

    @field_validator("question_text", mode="before")
    @classmethod
    def strip_text(cls, value):
        return str(value or "").strip()

    @model_validator(mode="after")
    def check_options(self):
        if not self.is_mcq:
            return self
        options = self.options or []
        if len(options) < 2:
            raise ValueError("Each multiple-choice question needs at least two options")
        if any(not option.option_text for option in options):
            raise ValueError("Options can't be blank")
        if len({option.option_text.lower() for option in options}) != len(options):
            raise ValueError("Options in a question must be different")
        correct = sum(1 for option in options if option.is_correct)
        if correct != 1:
            raise ValueError("Mark exactly one option as correct")
        return self


class QuizCreate(BaseModel):
    course_id: int
    title: str = Field(min_length=1, max_length=200)
    total_marks: int = Field(gt=0)
    duration_minutes: int = Field(default=60, gt=0, le=480)
    deadline: Optional[datetime] = None
    allow_late: bool = False
    questions: List[QuestionCreate] = Field(min_length=1)

    @field_validator("title", mode="before")
    @classmethod
    def strip_title(cls, value):
        return str(value or "").strip()

    @field_validator("deadline")
    @classmethod
    def require_timezone(cls, value: Optional[datetime]):
        if value is not None and value.tzinfo is None:
            raise ValueError("must include a timezone")
        return value

    @model_validator(mode="after")
    def check_total(self):
        question_total = sum(question.marks for question in self.questions)
        if question_total != self.total_marks:
            raise ValueError(
                f"Total marks ({self.total_marks}) must equal the sum of the question marks ({question_total})"
            )
        return self
