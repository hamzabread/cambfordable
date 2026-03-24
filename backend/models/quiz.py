# models/quiz.py
from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, TIMESTAMP
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime, timezone

class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    title = Column(String, nullable=False)
    total_marks = Column(Integer, nullable=False)
    deadline = Column(TIMESTAMP(timezone=True), nullable=True)
    allow_late = Column(Boolean, default=False)
    solution_url = Column(String, nullable=True)  # URL to uploaded solution file

    questions = relationship("QuizQuestion", back_populates="quiz")
    submissions = relationship("QuizSubmission", back_populates="quiz")

    @property
    def is_published(self):
        """Quiz is published if deadline not reached yet."""
        if self.deadline:
            return datetime.now(timezone.utc) <= self.deadline
        return True  # no deadline means always published
