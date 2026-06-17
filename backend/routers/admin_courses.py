# routers/admin_courses.py
import os

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import or_
from sqlalchemy.orm import Session

from database import get_db
from core.security import get_current_admin, get_user_from_token
from schemas.enrollments import AdminEnrollRequest, AdminPaymentRequest, EnrollmentPaymentOut
from crud.enrollments import admin_enroll_user, ensure_enrollment_paid, expire_due_enrollments
from models.users import User
from models.enrollments import Enrollment
from models.courses import Course
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
    expire_due_enrollments(db)
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


def _course_has_unseen_payment(db: Session, course: Course) -> bool:
    """
    True if a student submitted a proof for this course while unpaid AND that
    proof is newer than the last time an admin opened the course's payments.
    """
    query = db.query(Enrollment).filter(
        Enrollment.course_id == course.id,
        Enrollment.paid == False,  # noqa: E712
        or_(
            Enrollment.payment_proof_data.isnot(None),
            Enrollment.payment_proof_url.isnot(None),
        ),
    )
    if course.payments_seen_at is not None:
        query = query.filter(Enrollment.payment_uploaded_at > course.payments_seen_at)
    return query.first() is not None


@router.get("/pending-payments")
def get_pending_payments(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    """
    Per-course pending-payment notifications, seen-aware. Returns the ids of
    courses that have a new (unreviewed) payment proof. Drives the red dot on
    each course block in the Payments tab as well as the tab's own red dot.
    """
    # Sweep expired subscriptions first so their (now-removed) proofs don't count.
    expire_due_enrollments(db)
    courses = db.query(Course).all()
    course_ids = [c.id for c in courses if _course_has_unseen_payment(db, c)]
    return {"course_ids": course_ids, "has_pending": len(course_ids) > 0}


@router.post("/{course_id}/mark-payments-seen")
def mark_payments_seen(
    course_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    """Mark a course's payments as reviewed, clearing its red dot."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    course.payments_seen_at = datetime.utcnow()
    db.commit()
    return {"message": "Payments marked as seen", "course_id": course_id}


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
        paid=payload.paid,
    )

    if error == "user":
        raise HTTPException(status_code=404, detail="User not found")
    if error == "course":
        raise HTTPException(status_code=404, detail="Course not found")
    if error == "exists":
        # Already enrolled. When this assignment grants paid access (e.g. making
        # someone a teacher in this course), upgrade the existing enrollment to
        # paid instead of erroring out.
        if payload.paid:
            ensure_enrollment_paid(db, payload.user_id, payload.course_id)
            return {"message": "Student enrolled successfully"}
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
    # If marking as paid now, start the 32-day subscription clock, set enrolled_at
    # and send the welcome message. Marking unpaid stops the clock.
    if payload.paid:
        enrollment.paid_at = datetime.utcnow()
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
    else:
        # Manually revoked — stop the subscription clock.
        enrollment.paid_at = None

    db.commit()
    db.refresh(enrollment)

    return {
        "message": "Payment status updated successfully",
        "user_id": enrollment.user_id,
        "course_id": enrollment.course_id,
        "paid": enrollment.paid,
    }
