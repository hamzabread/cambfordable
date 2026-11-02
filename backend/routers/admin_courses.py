# routers/admin_courses.py
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from core.security import get_current_admin
from schemas.enrollments import (
    AdminEnrollRequest,
    AdminPaymentApproveRequest,
    AdminPaymentRejectRequest,
    AdminPaymentRequest,
    EnrollmentPaymentOut,
)
from crud.billing import approve_payment, billing_state, pause_enrollment, reject_proof, run_billing_cycle
from crud.enrollments import admin_enroll_user, send_enrollment_welcome
from models.users import User
from models.enrollments import Enrollment
from crud.notifications import create_notification

router = APIRouter(
    prefix="/admin/courses",
    tags=["Admin Courses"],
)


def _get_enrollment(db: Session, user_id: int, course_id: int) -> Enrollment:
    enrollment = db.query(Enrollment).filter(
        Enrollment.user_id == user_id,
        Enrollment.course_id == course_id,
    ).first()
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    return enrollment


@router.get("/enrollments/{course_id}", response_model=list[EnrollmentPaymentOut])
def get_course_enrollments(
    course_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    """Every enrollment in a course, paid or not, with its billing state."""
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
            "payment_rejection_reason": enrollment.payment_rejection_reason,
            "enrolled_at": enrollment.enrolled_at,
            "user": enrollment.user,
            **{
                key: value
                for key, value in billing_state(enrollment).items()
                if key in {"proof_pending", "paid_until", "overdue", "pauses_on", "paused_at", "removal_on"}
            },
        }
        for enrollment in enrollments
    ]

@router.post("/enroll")
def admin_enroll_student(
    payload: AdminEnrollRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin),
):
    enrollment, error = admin_enroll_user(
        db,
        user_id=payload.user_id,
        course_id=payload.course_id,
        paid=True,
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

    create_notification(
        db,
        user_id=payload.user_id,
        kind="enrollment",
        title="Course access granted",
        message=f"You now have access to {enrollment.course.name}.",
        href="/courses",
    )
    send_enrollment_welcome(
        background_tasks,
        user=enrollment.user,
        course=enrollment.course,
    )
    return {"message": "Student enrolled successfully"}


@router.post("/unenroll")
def admin_unenroll_student(
    payload: AdminEnrollRequest,
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin),
):
    """Unenroll a student from a course. Their payment proofs stay on record."""
    enrollment = _get_enrollment(db, payload.user_id, payload.course_id)

    course_name = enrollment.course.name if enrollment.course else "the course"
    db.delete(enrollment)
    db.commit()
    if payload.user_id != admin_user.id:
        create_notification(
            db,
            user_id=payload.user_id,
            kind="enrollment",
            title="Removed from a course",
            message=f"You no longer have access to {course_name}. Contact us if you think this is a mistake.",
            href="/contact",
        )

    return {"message": "Student unenrolled successfully"}


@router.post("/payment/approve")
def admin_approve_payment(
    payload: AdminPaymentApproveRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin),
):
    """Approve a first payment or a monthly renewal: access runs one more month."""
    enrollment = approve_payment(db, _get_enrollment(db, payload.user_id, payload.course_id), background_tasks)
    return {
        "message": "Payment approved",
        "paid": enrollment.paid,
        "paid_until": enrollment.paid_until,
    }


@router.patch("/payment")
def admin_update_payment_status(
    payload: AdminPaymentRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin),
):
    """Manual switch: paid=True approves a month; paid=False pauses access."""
    enrollment = _get_enrollment(db, payload.user_id, payload.course_id)

    if payload.paid and not enrollment.paid:
        approve_payment(db, enrollment, background_tasks)
    elif not payload.paid and enrollment.paid:
        pause_enrollment(db, enrollment, background_tasks=background_tasks)

    db.refresh(enrollment)
    return {
        "message": "Payment status updated successfully",
        "user_id": enrollment.user_id,
        "course_id": enrollment.course_id,
        "paid": enrollment.paid,
        "paid_until": enrollment.paid_until,
    }


@router.post("/payment/reject")
def admin_reject_payment_proof(
    payload: AdminPaymentRejectRequest,
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin),
):
    """Turn a proof down with a reason. The student sees the reason and can
    upload a new proof; any access they already have is unchanged."""
    enrollment = _get_enrollment(db, payload.user_id, payload.course_id)
    if not enrollment.proof_pending:
        raise HTTPException(status_code=409, detail="There is no payment proof waiting for review.")
    reject_proof(db, enrollment, payload.reason)
    return {"message": "Payment proof rejected"}


@router.post("/billing/run")
def admin_run_billing(
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin),
):
    """Run the hourly billing checks now (reminders, pauses, removals, old proofs)."""
    return run_billing_cycle(db)
