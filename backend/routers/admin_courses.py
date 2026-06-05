# routers/admin_courses.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from core.security import get_current_admin
from schemas.enrollments import AdminEnrollRequest, AdminPaymentRequest, EnrollmentPaymentOut
from crud.enrollments import admin_enroll_user
from models.users import User
from models.enrollments import Enrollment
from datetime import datetime
from core.whatsapp import whatsapp_service

router = APIRouter(
    prefix="/admin/courses",
    tags=["Admin Courses"],
)

@router.get("/enrollments/{course_id}", response_model=list[EnrollmentPaymentOut])
def get_course_enrollments(
    course_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    """Get all students enrolled in a specific course"""
    enrollments = db.query(Enrollment).filter(
        Enrollment.course_id == course_id
    ).all()

    return [
        {
            "user_id": enrollment.user_id,
            "course_id": enrollment.course_id,
            "paid": enrollment.paid,
            "payment_proof_url": enrollment.payment_proof_url,
            "payment_proof_name": enrollment.payment_proof_name,
            "user": enrollment.user,
        }
        for enrollment in enrollments
    ]

@router.post("/enroll")
def admin_enroll_student(
    payload: AdminEnrollRequest,
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin),
):
    enrollment, error = admin_enroll_user(
        db,
        user_id=payload.user_id,
        course_id=payload.course_id,
    )

    if error == "user":
        raise HTTPException(status_code=404, detail="User not found")
    if error == "course":
        raise HTTPException(status_code=404, detail="Course not found")
    if error == "exists":
        raise HTTPException(
            status_code=400,
            detail="User already enrolled in this course",
        )

    return {"message": "Student enrolled successfully"}


@router.post("/unenroll")
def admin_unenroll_student(
    payload: AdminEnrollRequest,
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin),
):
    """Unenroll a student from a course"""
    enrollment = db.query(Enrollment).filter(
        Enrollment.user_id == payload.user_id,
        Enrollment.course_id == payload.course_id,
    ).first()

    if not enrollment:
        raise HTTPException(
            status_code=404,
            detail="Enrollment not found",
        )

    db.delete(enrollment)
    db.commit()

    return {"message": "Student unenrolled successfully"}


@router.patch("/payment")
def admin_update_payment_status(
    payload: AdminPaymentRequest,
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin),
):
    enrollment = db.query(Enrollment).filter(
        Enrollment.user_id == payload.user_id,
        Enrollment.course_id == payload.course_id,
    ).first()

    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")

    enrollment.paid = payload.paid
    # If marking as paid now, set enrolled_at and send welcome message
    if payload.paid:
        enrollment.enrolled_at = datetime.utcnow()
        # send whatsapp welcome if user has phone and course has invite link
        try:
            course = db.query(Enrollment).filter(Enrollment.id == enrollment.id).first().course
            if enrollment.user and enrollment.user.phone_number:
                whatsapp_service.send_welcome_message(
                    phone_number=enrollment.user.phone_number,
                    course_name=course.name,
                    invite_link=course.whatsapp_invite_link,
                )
        except Exception:
            pass

    db.commit()
    db.refresh(enrollment)

    return {
        "message": "Payment status updated successfully",
        "user_id": enrollment.user_id,
        "course_id": enrollment.course_id,
        "paid": enrollment.paid,
    }
