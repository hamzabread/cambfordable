"""Monthly course billing.

Each student's access runs for BILLING_PERIOD from approval. Three days before
it ends they get a reminder; when it ends they get an overdue notice and a
three-day grace period; then access pauses. A paused enrollment is removed a
month later. Paying while still active extends from the current due date, so
paying early never loses days. Staff enrollments (admins, TAs) are never billed.

Payment proofs are kept as records for a year, then deleted.
"""
import logging
import os
from datetime import datetime, timedelta, timezone

from fastapi import BackgroundTasks
from sqlalchemy.orm import Session

from core.email import email_service
from crud.enrollments import send_enrollment_welcome
from crud.notifications import create_notification
from models.courses import Course
from models.enrollments import Enrollment
from models.payment_proof import PaymentProof
from models.users import User

logger = logging.getLogger(__name__)

BILLING_PERIOD = timedelta(days=30)
REMINDER_BEFORE = timedelta(days=3)
GRACE_PERIOD = timedelta(days=3)
REMOVE_AFTER_PAUSE = timedelta(days=30)
# Students can upload the next payment this long before it is due.
RENEWAL_WINDOW = timedelta(days=7)
PROOF_RETENTION = timedelta(days=365)


def as_utc(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    return value if value.tzinfo else value.replace(tzinfo=timezone.utc)


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def format_day(value: datetime) -> str:
    return f"{as_utc(value):%d %b %Y}"


def is_staff(user: User | None) -> bool:
    return bool(user and (user.is_admin or user.is_ta))


def billing_state(enrollment: Enrollment, now: datetime | None = None) -> dict:
    """What the student and admin screens need to know about an enrollment."""
    now = as_utc(now) or now_utc()
    paid_until = as_utc(enrollment.paid_until)
    paused_at = as_utc(enrollment.paused_at)
    # Staff aren't billed, and nobody is billed for an archived (finished) course.
    unbilled = is_staff(enrollment.user) or bool(enrollment.course and enrollment.course.archived_at)
    overdue = bool(enrollment.paid and paid_until and now > paid_until and not unbilled)
    renewal_open = (
        not unbilled
        and not enrollment.proof_pending
        and (
            (enrollment.paid and paid_until is not None and paid_until - now <= RENEWAL_WINDOW)
            or (not enrollment.paid and paused_at is not None)
        )
    )
    return {
        "paid_until": None if unbilled else paid_until,
        "overdue": overdue,
        "pauses_on": paid_until + GRACE_PERIOD if overdue else None,
        "paused_at": paused_at,
        "removal_on": paused_at + REMOVE_AFTER_PAUSE if paused_at and not enrollment.paid else None,
        "renewal_open": renewal_open,
        "proof_pending": bool(enrollment.proof_pending),
    }


def _tell_student(
    db: Session,
    enrollment: Enrollment,
    title: str,
    message: str,
    *,
    href: str = "/courses",
    background_tasks: BackgroundTasks | None = None,
    email: bool = True,
) -> None:
    create_notification(db, user_id=enrollment.user_id, kind="enrollment", title=title, message=message, href=href)
    user = enrollment.user
    if not (email and user and user.email):
        return
    args = dict(
        to_email=user.email,
        student_name=user.full_name or user.username,
        subject=title,
        message=message,
        link_path=href,
    )
    if background_tasks is not None:
        background_tasks.add_task(email_service.send_notice, **args)
    else:
        email_service.send_notice(**args)


def _course_name(enrollment: Enrollment) -> str:
    return enrollment.course.name if enrollment.course else "your course"


def record_proof(db: Session, enrollment: Enrollment, file_url: str, original_name: str | None) -> PaymentProof:
    proof = PaymentProof(
        user_id=enrollment.user_id,
        course_id=enrollment.course_id,
        file_url=file_url,
        original_name=original_name,
        status="pending",
    )
    db.add(proof)
    enrollment.payment_proof_url = file_url
    enrollment.payment_proof_name = original_name
    enrollment.payment_rejection_reason = None
    enrollment.proof_pending = True
    db.commit()
    db.refresh(proof)
    return proof


def _review_pending_proofs(db: Session, enrollment: Enrollment, status: str, reason: str | None = None) -> None:
    for proof in db.query(PaymentProof).filter(
        PaymentProof.user_id == enrollment.user_id,
        PaymentProof.course_id == enrollment.course_id,
        PaymentProof.status == "pending",
    ):
        proof.status = status
        proof.rejection_reason = reason
        proof.reviewed_at = now_utc()


def approve_payment(db: Session, enrollment: Enrollment, background_tasks: BackgroundTasks | None = None) -> Enrollment:
    """Approve the pending proof (or a manual payment) and extend access by one period."""
    now = now_utc()
    was_paid = enrollment.paid
    was_paused = enrollment.paused_at is not None
    first_approval = enrollment.paid_at is None
    paid_until = as_utc(enrollment.paid_until)

    # Active students extend from their due date; anyone else starts today.
    base = paid_until if was_paid and paid_until else now
    enrollment.paid_until = base + BILLING_PERIOD
    enrollment.paid = True
    enrollment.paused_at = None
    enrollment.proof_pending = False
    enrollment.payment_rejection_reason = None
    if first_approval:
        enrollment.paid_at = datetime.utcnow()
        enrollment.enrolled_at = datetime.utcnow()
    _review_pending_proofs(db, enrollment, "approved")
    db.commit()
    db.refresh(enrollment)

    course = _course_name(enrollment)
    until = format_day(enrollment.paid_until)
    if first_approval:
        create_notification(
            db,
            user_id=enrollment.user_id,
            kind="enrollment",
            title="Enrollment confirmed",
            message=f"Your enrollment in {course} is now active until {until}.",
            href="/courses",
        )
        if background_tasks is not None:
            send_enrollment_welcome(background_tasks, user=enrollment.user, course=enrollment.course)
    elif was_paused or not was_paid:
        _tell_student(db, enrollment, "Course access restored", f"Your access to {course} is active again until {until}.", background_tasks=background_tasks)
    else:
        _tell_student(db, enrollment, "Payment received", f"Thanks! Your access to {course} now runs until {until}.", background_tasks=background_tasks)
    return enrollment


def reject_proof(db: Session, enrollment: Enrollment, reason: str) -> None:
    """Turn down the pending proof. Current access (if any) is unchanged."""
    _review_pending_proofs(db, enrollment, "rejected", reason)
    last_approved = (
        db.query(PaymentProof)
        .filter(
            PaymentProof.user_id == enrollment.user_id,
            PaymentProof.course_id == enrollment.course_id,
            PaymentProof.status == "approved",
        )
        .order_by(PaymentProof.uploaded_at.desc())
        .first()
    )
    enrollment.payment_proof_url = last_approved.file_url if last_approved else None
    enrollment.payment_proof_name = last_approved.original_name if last_approved else None
    enrollment.payment_rejection_reason = reason
    enrollment.proof_pending = False
    db.commit()
    create_notification(
        db,
        user_id=enrollment.user_id,
        kind="enrollment",
        title="Payment proof not accepted",
        message=f"Your payment proof for {_course_name(enrollment)} was not accepted: {reason}. Please upload a new one.",
        href="/courses",
    )


def pause_enrollment(db: Session, enrollment: Enrollment, *, notify: bool = True, background_tasks: BackgroundTasks | None = None) -> None:
    now = now_utc()
    enrollment.paid = False
    enrollment.paused_at = now
    db.commit()
    if notify:
        _tell_student(
            db,
            enrollment,
            "Course access paused",
            f"Your access to {_course_name(enrollment)} is paused because the payment is overdue. "
            f"Upload a payment proof to restore it. If no payment arrives by {format_day(now + REMOVE_AFTER_PAUSE)}, "
            "you'll be removed from the course.",
            background_tasks=background_tasks,
        )


def _delete_file(file_url: str) -> None:
    path = file_url.lstrip("/").replace("\\", "/")
    if not path.startswith("uploads/payments/"):
        return
    try:
        os.remove(path)
    except FileNotFoundError:
        pass
    except OSError as error:
        logger.warning("Could not delete old payment proof %s: %s", path, error)


def run_billing_cycle(db: Session, now: datetime | None = None) -> dict:
    """Send reminders, pause and remove overdue enrollments, and purge proofs
    older than a year. Safe to run as often as you like."""
    now = as_utc(now) or now_utc()
    counts = {"started": 0, "reminded": 0, "overdue": 0, "paused": 0, "removed": 0, "proofs_deleted": 0}

    enrollments = (
        db.query(Enrollment)
        .join(User, User.id == Enrollment.user_id)
        .join(Course, Course.id == Enrollment.course_id)
        # Archived courses have finished: nobody is billed for them.
        .filter(User.is_admin.is_(False), User.is_ta.is_(False), Course.archived_at.is_(None))
        .all()
    )
    for enrollment in enrollments:
        course = _course_name(enrollment)
        paid_until = as_utc(enrollment.paid_until)

        if enrollment.paid:
            if paid_until is None:
                # Paid before monthly billing existed: their first month starts now.
                enrollment.paid_until = now + BILLING_PERIOD
                db.commit()
                counts["started"] += 1
                continue

            if paid_until - REMINDER_BEFORE <= now < paid_until and as_utc(enrollment.reminder_sent_for) != paid_until:
                days = max(1, (paid_until - now).days + (1 if (paid_until - now).seconds else 0))
                enrollment.reminder_sent_for = paid_until
                db.commit()
                _tell_student(
                    db,
                    enrollment,
                    "Payment due soon",
                    f"Your access to {course} runs until {format_day(paid_until)} ({days} day{'s' if days != 1 else ''} left). "
                    "Upload this month's payment proof to keep your place.",
                )
                counts["reminded"] += 1
            elif paid_until <= now < paid_until + GRACE_PERIOD and as_utc(enrollment.overdue_notice_for) != paid_until:
                enrollment.overdue_notice_for = paid_until
                db.commit()
                _tell_student(
                    db,
                    enrollment,
                    "Payment overdue",
                    f"Your payment for {course} was due on {format_day(paid_until)}. "
                    f"Upload a payment proof by {format_day(paid_until + GRACE_PERIOD)} or your access will be paused.",
                )
                counts["overdue"] += 1
            elif now >= paid_until + GRACE_PERIOD and not enrollment.proof_pending:
                # A proof waiting for review holds the pause until an admin decides.
                pause_enrollment(db, enrollment)
                counts["paused"] += 1
            continue

        paused_at = as_utc(enrollment.paused_at)
        if paused_at and now >= paused_at + REMOVE_AFTER_PAUSE and not enrollment.proof_pending:
            user_id = enrollment.user_id
            db.delete(enrollment)
            db.commit()
            create_notification(
                db,
                user_id=user_id,
                kind="enrollment",
                title="Removed from a course",
                message=f"You've been removed from {course} because no payment arrived within a month of your access being paused. "
                "You can request the course again at any time.",
                href="/courses",
            )
            counts["removed"] += 1

    cutoff = now - PROOF_RETENTION
    for proof in db.query(PaymentProof).filter(
        PaymentProof.uploaded_at < cutoff,
        PaymentProof.status != "pending",
    ).all():
        for enrollment in db.query(Enrollment).filter(Enrollment.payment_proof_url == proof.file_url):
            if not enrollment.proof_pending:
                enrollment.payment_proof_url = None
                enrollment.payment_proof_name = None
        _delete_file(proof.file_url)
        db.delete(proof)
        counts["proofs_deleted"] += 1
    db.commit()

    if any(counts.values()):
        logger.info("Billing cycle: %s", counts)
    return counts
