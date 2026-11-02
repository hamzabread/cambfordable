from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String

from database import Base


class ClassAttendance(Base):
    """Who attended a live class and for how long, from Zoom's participant
    report (or the portal's own join heartbeats when Zoom has no report)."""

    __tablename__ = "class_attendance"

    id = Column(Integer, primary_key=True, index=True)
    live_class_id = Column(Integer, ForeignKey("live_classes.id", ondelete="CASCADE"), nullable=False, index=True)
    # Null when a Zoom participant couldn't be matched to a portal account.
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    display_name = Column(String, nullable=False)
    minutes = Column(Integer, nullable=False, default=0)
    first_join = Column(DateTime(timezone=True), nullable=True)
    last_leave = Column(DateTime(timezone=True), nullable=True)
    # zoom | portal
    source = Column(String(10), nullable=False, default="zoom")
    recorded_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
