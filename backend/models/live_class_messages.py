from sqlalchemy import Column, Integer, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from database import Base

class LiveClassMessage(Base):
    __tablename__ = "live_class_messages"

    id = Column(Integer, primary_key=True)
    live_class_id = Column(Integer, ForeignKey("live_classes.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))

    user = relationship("User")
    live_class = relationship("LiveClass")
