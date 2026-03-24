from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from models.live_classes import LiveClass
from schemas.live_classes import LiveClassCreate
from models.enrollments import Enrollment
from models.users import User
from models.courses import Course
from fastapi import HTTPException
from core.zoom_api import create_zoom_meeting
from core.whatsapp import whatsapp_service

async def create_live_class(db: Session, title: str, course_id: int, starts_at: datetime, duration: int = 60):
    """
    Creates a Zoom meeting dynamically and saves the live class in the database.
    """
    # 1. Create Zoom meeting
    zoom_meeting = await create_zoom_meeting(topic=title, start_time=starts_at)

    # 2. Save the live class in DB
    live_class = LiveClass(
        course_id=course_id,
        title=title,
        starts_at=starts_at,
        ends_at=starts_at + timedelta(minutes=duration),
        meeting_id=str(zoom_meeting["meeting_id"]),
        meeting_password=zoom_meeting.get("password")
        # Note: we no longer need meeting_url in your model
    )

    db.add(live_class)
    db.commit()
    db.refresh(live_class)
    
    # 3. Send WhatsApp notification to all enrolled students individually
    enrolled_users = (
        db.query(User)
        .join(Enrollment, Enrollment.user_id == User.id)
        .filter(Enrollment.course_id == course_id)
        .filter(User.phone_number.isnot(None))
        .all()
    )
    phone_numbers = [u.phone_number for u in enrolled_users]
    if phone_numbers:
        whatsapp_service.send_live_class_notification(
            phone_numbers=phone_numbers,
            class_title=title,
            join_url=zoom_meeting["join_url"],
        )

    return {
        "id": live_class.id,
        "title": live_class.title,
        "course_id": live_class.course_id,
        "starts_at": live_class.starts_at,
        "ends_at": live_class.ends_at,
        "meeting_id": live_class.meeting_id,
        "meeting_password": live_class.meeting_password,
        "join_url": zoom_meeting["join_url"],
        "start_url": zoom_meeting["start_url"],  # secure, only for host
    }


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
