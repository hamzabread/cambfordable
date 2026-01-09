from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from database import Base

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)

    txn_ref = Column(String, unique=True, index=True, nullable=False)
    amount = Column(Integer, nullable=False)  # paisa
    provider = Column(String, default="JAZZCASH")
    status = Column(String, default="PENDING")  # PENDING | SUCCESS | FAILED

    created_at = Column(DateTime(timezone=True), server_default=func.now())
