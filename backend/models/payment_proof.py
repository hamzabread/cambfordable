from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text

from database import Base


class PaymentProof(Base):
    """Every proof a student uploads, kept for a year as a payment record even
    after the enrollment itself is removed."""

    __tablename__ = "payment_proofs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    file_url = Column(String, nullable=False)
    original_name = Column(String, nullable=True)
    # pending | approved | rejected
    status = Column(String(20), nullable=False, default="pending")
    rejection_reason = Column(Text, nullable=True)
    uploaded_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), index=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
