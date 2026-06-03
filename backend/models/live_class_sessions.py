from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Index
from sqlalchemy.orm import relationship

from database import Base


class LiveClassSession(Base):
    __tablename__ = "live_class_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    live_class_id = Column(Integer, ForeignKey("live_classes.id"), nullable=False, index=True)
    device_id = Column(String, nullable=False)

    started_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    last_seen = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    is_active = Column(Boolean, default=True, nullable=False, index=True)

    user = relationship("User")
    live_class = relationship("LiveClass")


Index("ix_live_class_sessions_user_active", LiveClassSession.user_id, LiveClassSession.is_active)
Index("ix_live_class_sessions_device", LiveClassSession.device_id)
