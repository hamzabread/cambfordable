from database import Base
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, Date, DateTime, Integer, String, Text
from sqlalchemy.orm import relationship

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)

    is_admin = Column(Boolean, default=False, nullable=False)
    is_ta = Column(Boolean, default=False, nullable=False)
    payment = Column(Boolean, default=False, nullable=False)
    phone_number = Column(String, nullable=True)  # For WhatsApp integration

    # Student profile fields. Academic fields are intentionally not editable by
    # students; they can be populated by an administrator or an SIS integration.
    date_of_birth = Column(Date, nullable=True)
    gender = Column(String, nullable=True)
    nationality = Column(String, nullable=True)
    permanent_address = Column(Text, nullable=True)
    student_id = Column(String, unique=True, index=True, nullable=True)
    major = Column(String, nullable=True)
    current_year = Column(String, nullable=True)
    academic_standing = Column(String, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=True,
    )

    # Tokens issued before this moment stop working (password change or reset).
    password_changed_at = Column(DateTime(timezone=True), nullable=True)

    enrollments = relationship(
        "Enrollment",
        back_populates="user",
        cascade="all, delete-orphan",
    )
