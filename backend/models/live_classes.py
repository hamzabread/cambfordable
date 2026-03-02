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

    meeting_id = Column(String, nullable=False) #zoom sdk

    course = relationship("Course", back_populates="live_classes")

    meeting_password = Column(String, nullable=True)
    
    # Attachment for past classes
    attachment_url = Column(String, nullable=True)

    @property
    def is_live(self) -> bool:
        now = datetime.now(timezone.utc)
        return self.starts_at <= now <= self.ends_at

    @property
    def join_url(self) -> str:
        """Generate join URL from meeting ID"""
        return f"https://zoom.us/wc/join/{self.meeting_id}"

    @property
    def start_url(self) -> str:
        """Generate start URL for host"""
        return f"https://zoom.us/wc/start/{self.meeting_id}"
