from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from database import Base


class CourseThread(Base):
    """A student's question to the course's teachers, outside class time.
    Visible to its author and the course staff only."""

    __tablename__ = "course_threads"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(150), nullable=False)
    is_resolved = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), index=True)

    author = relationship("User")
    course = relationship("Course")
    replies = relationship(
        "ThreadReply",
        back_populates="thread",
        cascade="all, delete-orphan",
        order_by="ThreadReply.created_at",
    )


class ThreadReply(Base):
    __tablename__ = "thread_replies"

    id = Column(Integer, primary_key=True, index=True)
    thread_id = Column(Integer, ForeignKey("course_threads.id", ondelete="CASCADE"), nullable=False, index=True)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    body = Column(Text, nullable=False)
    is_staff = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    thread = relationship("CourseThread", back_populates="replies")
    author = relationship("User")
