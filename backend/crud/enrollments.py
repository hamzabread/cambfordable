from datetime import datetime, timedelta

from sqlalchemy.orm import Session
from models.enrollments import Enrollment
from models.courses import Course
from models.users import User
from schemas.courses import CourseOut, EnrolledCourseBase
from core.whatsapp import whatsapp_service

# Subscription length. Payment is good for SUBSCRIPTION_DAYS from the moment an
# admin confirms it; REMINDER_DAYS in, the student is warned it's about to lapse.
SUBSCRIPTION_DAYS = 32
REMINDER_DAYS = 30  # i.e. remind when <= (SUBSCRIPTION_DAYS - REMINDER_DAYS) days remain


def expire_due_enrollments(db: Session) -> int:
    """
    Revert any enrollment whose 32-day paid period has elapsed: mark it unpaid
    again and wipe the stored payment proof. Cheap — only touches rows that are
    actually past due. Called on the busy admin/student read paths so it runs
    regularly without a dedicated background worker.
    """
    cutoff = datetime.utcnow() - timedelta(days=SUBSCRIPTION_DAYS)
    due = (
        db.query(Enrollment)
        .filter(
            Enrollment.paid == True,  # noqa: E712
            Enrollment.paid_at.isnot(None),
            Enrollment.paid_at <= cutoff,
        )
        .all()
    )
    if not due:
        return 0

    for enrollment in due:
        enrollment.paid = False
        enrollment.paid_at = None
        # The proof only covered the period that just ended — remove it so the
        # admin isn't shown a stale attachment and the student re-submits to renew.
        enrollment.payment_proof_data = None
        enrollment.payment_proof_url = None
        enrollment.payment_proof_name = None
        enrollment.payment_proof_mime = None
        enrollment.payment_uploaded_at = None

    db.commit()
    return len(due)

def create_enrollment(
    db: Session,
    user: User,
    course_id: int,
    payment_proof_url: str | None = None,
    payment_proof_name: str | None = None,
    payment_proof_data: bytes | None = None,
    payment_proof_mime: str | None = None,
):
    # check if enrollment already exists
    enrollment = db.query(Enrollment).filter(
        Enrollment.user_id == user.id,
        Enrollment.course_id == course_id
    ).first()

    if enrollment:
        # If the student re-submits proof while still unpaid, refresh the proof
        # instead of silently ignoring it. Never touch an already-paid enrollment.
        if payment_proof_data is not None and not enrollment.paid:
            enrollment.payment_proof_url = payment_proof_url
            enrollment.payment_proof_name = payment_proof_name
            enrollment.payment_proof_data = payment_proof_data
            enrollment.payment_proof_mime = payment_proof_mime
            enrollment.payment_uploaded_at = datetime.utcnow()
            db.commit()
            db.refresh(enrollment)
        return enrollment

    # create new enrollment
    enrollment = Enrollment(
        user_id=user.id,
        course_id=course_id,
        payment_proof_url=payment_proof_url,
        payment_proof_name=payment_proof_name,
        payment_proof_data=payment_proof_data,
        payment_proof_mime=payment_proof_mime,
        payment_uploaded_at=datetime.utcnow() if payment_proof_data is not None else None,
    )
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)

    # Note: do not send welcome message here. Welcome/auto-enrollment actions
    # are performed when an admin marks `paid=True` for the enrollment.

    return enrollment




def get_user_enrollments(db: Session, user: User):
    return (
        db.query(Enrollment)
        .filter(Enrollment.user_id == user.id)
        .all()
    )

def get_user_courses_with_progress(db: Session, user: User):
    # Drop any lapsed subscriptions first so an expired course stops showing up.
    expire_due_enrollments(db)
    # Only return enrollments that are marked as paid (approved)
    enrollments = (
        db.query(Enrollment)
        .filter(Enrollment.user_id == user.id, Enrollment.paid == True)
        .all()
    )

    return [
        EnrolledCourseBase(
            id=e.course.id,
            name=e.course.name,
            code=e.course.code,
            progress=e.progress,
            completed=e.completed,
        )
        for e in enrollments
    ]


def ensure_enrollment_paid(db: Session, user_id: int, course_id: int):
    """
    Guarantee that (user, course) has a *paid* enrollment.

    Creates the enrollment if missing, or upgrades an existing unpaid one to
    paid. Used so admins get paid access to every course and teachers get paid
    access to the course they're assigned to.
    """
    enrollment = (
        db.query(Enrollment)
        .filter(Enrollment.user_id == user_id, Enrollment.course_id == course_id)
        .first()
    )
    if enrollment:
        if not enrollment.paid:
            enrollment.paid = True
            db.commit()
            db.refresh(enrollment)
        return enrollment

    enrollment = Enrollment(user_id=user_id, course_id=course_id, paid=True)
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    return enrollment


def admin_enroll_user(
    db: Session,
    user_id: int,
    course_id: int,
    paid: bool = False,
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None, "user"

    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        return None, "course"

    existing = (
        db.query(Enrollment)
        .filter(
            Enrollment.user_id == user_id,
            Enrollment.course_id == course_id,
        )
        .first()
    )
    if existing:
        return None, "exists"

    enrollment = Enrollment(
        user_id=user_id,
        course_id=course_id,
        paid=paid,
    )
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)

    return enrollment, None