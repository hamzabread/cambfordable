from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class QuizAnswer(Base):
    __tablename__ = "quiz_answers"

    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("quiz_submissions.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("quiz_questions.id"), nullable=False)
    selected_option_id = Column(Integer, nullable=True)
    uploaded_file_url = Column(String, nullable=True)
    original_filename = Column(String, nullable=True)

    # 🔹 ADD THESE RELATIONSHIPS
    submission = relationship("QuizSubmission", back_populates="answers")
    question = relationship("QuizQuestion")
    
