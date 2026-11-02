from sqlalchemy import Column, Integer, ForeignKey, DateTime, UniqueConstraint, Boolean, String, Text
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
    enrolled_at = Column(DateTime, default=datetime.utcnow)
    # Set on the first approval, so toggling Paid again does not re-send welcomes.
    paid_at = Column(DateTime, nullable=True)
    # Why the last proof was rejected; cleared when a new proof is uploaded.
    payment_rejection_reason = Column(Text, nullable=True)

    # Monthly billing (crud/billing.py). Access runs until paid_until, then a
    # short grace period, then pauses (paid=False, paused_at set); a paused
    # enrollment is removed a month later.
    paid_until = Column(DateTime(timezone=True), nullable=True)
    paused_at = Column(DateTime(timezone=True), nullable=True)
    # The latest proof is waiting for an admin (first payment or renewal).
    proof_pending = Column(Boolean, default=False, nullable=False)
    # The paid_until value a reminder / overdue notice was already sent for.
    reminder_sent_for = Column(DateTime(timezone=True), nullable=True)
    overdue_notice_for = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="enrollments")
    course = relationship("Course", back_populates="enrollments")

    __table_args__ = (
        UniqueConstraint("user_id", "course_id", name="unique_user_course"),
    )
