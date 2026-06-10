# routers/admin_courses.py
import os

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session

from database import get_db
from core.security import get_current_admin, get_user_from_token
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


def _proof_path(enrollment: Enrollment) -> str | None:
    """URL (without auth token) the admin UI uses to view the proof from the DB."""
    if enrollment.payment_proof_data is not None or enrollment.payment_proof_url:
        return f"/admin/courses/payment-proof/{enrollment.user_id}/{enrollment.course_id}"
    return None


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
            "payment_proof_url": _proof_path(enrollment),
            "payment_proof_name": enrollment.payment_proof_name,
            "payment_uploaded_at": enrollment.payment_uploaded_at,
            "user": enrollment.user,
        }
        for enrollment in enrollments
    ]


@router.get("/pending-payments-count")
def get_pending_payments_count(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    """
    How many students have submitted a payment proof but are still unpaid.
    Drives the red-dot notification on the Payments tab.
    """
    count = (
        db.query(Enrollment)
        .filter(
            Enrollment.paid == False,  # noqa: E712
            (Enrollment.payment_proof_data.isnot(None))
            | (Enrollment.payment_proof_url.isnot(None)),
        )
        .count()
    )
    return {"count": count, "has_pending": count > 0}


@router.get("/payment-proof/{user_id}/{course_id}")
def view_payment_proof(
    user_id: int,
    course_id: int,
    token: str = Query(..., description="Admin access token (link is opened in a new tab)"),
    db: Session = Depends(get_db),
):
    """
    Serve a student's payment proof. Bytes are read from the DB first (so it
    works on Railway where the disk is wiped on redeploy), falling back to the
    legacy on-disk copy for older uploads. Auth comes via a query-param token
    because the proof is opened as a plain link/new tab.
    """
    admin_user = get_user_from_token(token, db)
    if not admin_user or not admin_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin privileges required")

    enrollment = (
        db.query(Enrollment)
        .filter(Enrollment.user_id == user_id, Enrollment.course_id == course_id)
        .first()
    )
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")

    filename = enrollment.payment_proof_name or "payment-proof"

    if enrollment.payment_proof_data is not None:
        return Response(
            content=enrollment.payment_proof_data,
            media_type=enrollment.payment_proof_mime or "application/octet-stream",
            headers={"Content-Disposition": f'inline; filename="{filename}"'},
        )

    # Legacy fallback: file saved to disk before DB storage existed.
    if enrollment.payment_proof_url:
        disk_path = enrollment.payment_proof_url.lstrip("/")
        if os.path.exists(disk_path):
            with open(disk_path, "rb") as fh:
                return Response(
                    content=fh.read(),
                    media_type=enrollment.payment_proof_mime or "application/octet-stream",
                    headers={"Content-Disposition": f'inline; filename="{filename}"'},
                )

    raise HTTPException(status_code=404, detail="Payment proof not found")

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
