from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime, timezone

class Homework(Base):
    __tablename__ = "homeworks"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    due_date = Column(DateTime(timezone=True), nullable=False, default=datetime.now(timezone.utc))
    
    course = relationship("Course", back_populates="homeworks")
    submissions = relationship("HomeworkSubmission", back_populates="homework")


class HomeworkSubmission(Base):
    __tablename__ = "homework_submissions"

    id = Column(Integer, primary_key=True, index=True)
    homework_id = Column(Integer, ForeignKey("homeworks.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    file_url = Column(String, nullable=False)  # Link to uploaded file
    submitted_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))

    homework = relationship("Homework", back_populates="submissions")
    user = relationship("User")
