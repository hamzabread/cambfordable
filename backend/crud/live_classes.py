from datetime import datetime, timezone
from sqlalchemy.orm import Session
from models.live_classes import LiveClass
from schemas.live_classes import LiveClassCreate
from models.enrollments import Enrollment
from models.users import User
from fastapi import HTTPException

def create_live_class(db: Session, live_class_in: LiveClassCreate):
    live_class = LiveClass(**live_class_in.dict())
    db.add(live_class)
    db.commit()
    db.refresh(live_class)
    return live_class


def get_joinable_live_class(db: Session, *, class_id: int, user: User) -> LiveClass:
    live_class = db.query(LiveClass).get(class_id)
    if not live_class:
        raise HTTPException(404, "Class not found")

    enrollment = db.query(Enrollment).filter(
        Enrollment.user_id == user.id,
        Enrollment.course_id == live_class.course_id
    ).first()
    if not enrollment:
        raise HTTPException(403, "You are not enrolled in this course")

    now = datetime.now(timezone.utc)
    if now < live_class.starts_at:
        raise HTTPException(403, "Class has not started yet")
    if now > live_class.ends_at:
        raise HTTPException(403, "Class has ended")

    # ✅ no need to assign is_live
    return live_class

def get_user_live_classes(db: Session, user: User):
    return (
        db.query(LiveClass)
        .join(Enrollment, Enrollment.course_id == LiveClass.course_id)
        .filter(Enrollment.user_id == user.id)
        .all()
    )
