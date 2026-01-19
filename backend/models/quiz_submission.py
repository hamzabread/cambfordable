# models/quiz_submission.py
from sqlalchemy import Column, Integer, ForeignKey, Boolean, TIMESTAMP
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class QuizSubmission(Base):
    __tablename__ = "quiz_submissions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    score = Column(Integer, nullable=True)
    submitted_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow)
    is_late = Column(Boolean, default=False)
    tab_switches = Column(Integer, default=0)
    fullscreen_exits = Column(Integer, default=0)
    auto_submitted = Column(Boolean, default=False)
    flagged_for_review = Column(Boolean, default=False)

    quiz = relationship("Quiz", back_populates="submissions")
    answers = relationship(
        "QuizAnswer",
        back_populates="submission",
        cascade="all, delete-orphan"
    )
    user = relationship("User") 
