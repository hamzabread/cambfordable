from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from database import get_db
from core.security import get_current_user, get_current_admin_or_teacher
from models.users import User
from datetime import datetime, timedelta
from math import ceil

from crud.enrollments import (
    create_enrollment,
    get_user_enrollments,
    get_user_courses_with_progress,
    expire_due_enrollments,
    ensure_enrollment_paid,
    SUBSCRIPTION_DAYS,
    REMINDER_DAYS,
)
from models.enrollments import Enrollment
from schemas.courses import CourseOut, EnrolledCourseBase, CoursePaymentStatusOut
from crud.courses import get_all_courses, create_course
from routers.uploads import PAYMENT_UPLOAD_DIR, save_file


router = APIRouter(prefix="/courses", tags=["Courses"])


@router.post("/{course_id}/enroll")
def enroll_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    enrollment = create_enrollment(db, current_user, course_id)
    if not enrollment:
        raise HTTPException(status_code=404, detail="Course not found")

    return {"message": "Enrolled successfully"}


@router.post("/{course_id}/enroll-with-proof")
async def enroll_course_with_proof(
    course_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Read the proof bytes so they can be persisted in the database. Railway's
    # filesystem is ephemeral (wiped on every redeploy), so a disk-only copy is
    # not reliably visible to the admin in production.
    proof_bytes = await file.read()
    if not proof_bytes:
        raise HTTPException(status_code=400, detail="Empty payment proof file")

    # Best-effort disk copy too (useful for local dev / quick preview).
    await file.seek(0)
    try:
        file_path = save_file(file, PAYMENT_UPLOAD_DIR)
        formatted_path = f"/{file_path}"
    except Exception:
        formatted_path = None

    enrollment = create_enrollment(
        db,
        current_user,
        course_id,
        payment_proof_url=formatted_path,
        payment_proof_name=file.filename,
        payment_proof_data=proof_bytes,
        payment_proof_mime=file.content_type or "application/octet-stream",
    )
    if not enrollment:
        raise HTTPException(status_code=404, detail="Course not found")

    return {
        "message": "Payment proof submitted; pending admin approval",
        "payment_proof_name": file.filename,
    }


@router.get("/me", response_model=list[EnrolledCourseBase])
def my_courses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_user_courses_with_progress(db, current_user)


@router.get("/payment-status", response_model=list[CoursePaymentStatusOut])
def my_payment_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Per-course subscription status for the logged-in student: when each paid
    course expires and how many days remain. `reminder` flips on 2 days before
    expiry so the student panel can warn them their payment is about to lapse.
    """
    # Sweep first so anything already past 32 days is dropped (and not reported).
    expire_due_enrollments(db)

    now = datetime.utcnow()
    enrollments = (
        db.query(Enrollment)
        .filter(
            Enrollment.user_id == current_user.id,
            Enrollment.paid == True,  # noqa: E712
            Enrollment.paid_at.isnot(None),
        )
        .all()
    )

    statuses = []
    for e in enrollments:
        expires_at = e.paid_at + timedelta(days=SUBSCRIPTION_DAYS)
        seconds_left = (expires_at - now).total_seconds()
        days_remaining = max(0, ceil(seconds_left / 86400))
        statuses.append(
            CoursePaymentStatusOut(
                course_id=e.course_id,
                course_name=e.course.name,
                paid_at=e.paid_at,
                expires_at=expires_at,
                days_remaining=days_remaining,
                reminder=0 < days_remaining <= (SUBSCRIPTION_DAYS - REMINDER_DAYS),
            )
        )
    return statuses



@router.get("/", response_model=list[CourseOut])
def list_courses(db: Session = Depends(get_db)):
    return get_all_courses(db)

@router.post("/", response_model=CourseOut)
def admin_create_course(
    course_in: CourseOut,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_or_teacher)
):
    # Create the course
    course = create_course(db, course_in)

    # Every admin gets paid access to every course, so give all admins a paid
    # enrollment in this new course. Also covers the creator when they're a
    # teacher (not in the admin list).
    admins = db.query(User).filter(User.is_admin == True).all()  # noqa: E712
    for admin in admins:
        ensure_enrollment_paid(db, admin.id, course.id)
    ensure_enrollment_paid(db, admin_user.id, course.id)

    return course


