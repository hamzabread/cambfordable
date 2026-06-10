from database import Base
from sqlalchemy import Column, Integer, String, Boolean
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
    is_teacher = Column(Boolean, default=False, nullable=False)
    payment = Column(Boolean, default=False, nullable=False)
    phone_number = Column(String, nullable=True)  # For WhatsApp integration

    enrollments = relationship(
        "Enrollment",
        back_populates="user",
        cascade="all, delete-orphan",
    )
