from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.orm import relationship
from database import Base

class Course(Base):

    __tablename__ = "courses"

    id = Column(Integer, primary_key = True, index = True)
    name = Column(String, nullable = False)
    code = Column(String, nullable = False, unique = True)
    next_class = Column(String, nullable=True)
    time = Column(String, nullable=True)
    whatsapp_invite_link = Column(String, nullable=True)  # Manual WhatsApp group invite link
    # When an admin last opened this course's payments. A pending proof newer
    # than this still shows a red dot; opening the course updates it (clears dot).
    payments_seen_at = Column(DateTime, nullable=True)

    enrollments = relationship(
        "Enrollment",
        back_populates="course",
        cascade="all, delete-orphan",
    )

    live_classes = relationship("LiveClass", back_populates="course")

    homeworks = relationship("Homework", back_populates="course")
