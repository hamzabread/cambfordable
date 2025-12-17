from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime, timezone

class LiveClass(Base):
    __tablename__ = "live_classes"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)

    title = Column(String, nullable=False)

    starts_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))
    ends_at = Column(DateTime(timezone=True))

    meeting_url = Column(String, nullable=False)

    course = relationship("Course", back_populates="live_classes")

    @property
    def is_live(self) -> bool:
        now = datetime.now(timezone.utc)
        return self.starts_at <= now <= self.ends_at
