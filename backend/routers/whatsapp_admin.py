from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models.courses import Course
from schemas.whatsapp import SetWhatsAppInviteLinkRequest, CourseOutWithWhatsApp
from database import get_db
from core.security import get_current_admin

router = APIRouter(prefix="/admin/whatsapp", tags=["admin-whatsapp"])

@router.post("/courses/{course_id}/whatsapp-link")
def set_course_whatsapp_link(
    course_id: int,
    request: SetWhatsAppInviteLinkRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """
    Set the WhatsApp group invite link for a course (Admin only).

    This link is shared with students when they enrol so they can
    join the course's WhatsApp group manually.
    """
    course = db.query(Course).filter(Course.id == course_id).first()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    course.whatsapp_invite_link = request.whatsapp_invite_link
    db.commit()
    db.refresh(course)

    return {
        "message": "WhatsApp invite link updated successfully",
        "course": {
            "id": course.id,
            "name": course.name,
            "whatsapp_invite_link": course.whatsapp_invite_link,
        },
    }

@router.get("/courses/{course_id}/whatsapp-link")
def get_course_whatsapp_link(
    course_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Get WhatsApp invite link for a course"""
    course = db.query(Course).filter(Course.id == course_id).first()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    return CourseOutWithWhatsApp.from_orm(course)

@router.delete("/courses/{course_id}/whatsapp-link")
def remove_course_whatsapp_link(
    course_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Remove WhatsApp invite link from a course"""
    course = db.query(Course).filter(Course.id == course_id).first()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    course.whatsapp_invite_link = None
    db.commit()
    db.refresh(course)

    return {
        "message": "WhatsApp invite link removed",
        "course_id": course.id,
    }
