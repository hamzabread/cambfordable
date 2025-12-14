from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.orm import relationship
from database import Base

class Course(Base): 

    __tablename__ = "courses"

    id = Column(Integer, primary_key = True, index = True)
    name = Column(String, nullable = False)
    code = Column(String, nullable = False, unique = True)
    next_class = Column(String, nullable=True)
    time = Column(String, nullable=True)

    enrollments = relationship(
        "Enrollment",
        back_populates="course",
        cascade="all, delete-orphan",
    )