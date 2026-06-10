from sqlalchemy import Column, Integer, ForeignKey, DateTime, UniqueConstraint, Boolean, String, LargeBinary
from sqlalchemy.orm import relationship
from datetime import datetime

from database import Base

class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"))

    progress = Column(Integer, default=0)
    completed = Column(Integer, default=0)
    paid = Column(Boolean, default=False, nullable=False)
    payment_proof_url = Column(String, nullable=True)
    payment_proof_name = Column(String, nullable=True)
    # Proof bytes are stored in the DB so they survive Railway's ephemeral
    # filesystem (the local uploads/ folder is wiped on every redeploy).
    payment_proof_data = Column(LargeBinary, nullable=True)
    payment_proof_mime = Column(String, nullable=True)
    payment_uploaded_at = Column(DateTime, nullable=True)
    enrolled_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="enrollments")
    course = relationship("Course", back_populates="enrollments")

    __table_args__ = (
        UniqueConstraint("user_id", "course_id", name="unique_user_course"),
    )
