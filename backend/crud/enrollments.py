from fastapi import BackgroundTasks
from sqlalchemy import func
from sqlalchemy.orm import Session
from models.homeworks import Homework, HomeworkSubmission
from models.quiz import Quiz
from models.quiz_submission import QuizSubmission
from models.enrollments import Enrollment
from models.courses import Course
from models.users import User
from schemas.courses import CourseOut, EnrolledCourseBase
from core.email import email_service
from core.whatsapp import whatsapp_service
from datetime import datetime, timedelta, timezone


def send_enrollment_welcome(
    background_tasks: BackgroundTasks,
    *,
    user: User,
    course: Course,
) -> None:
    """
    Queue the welcome email (and WhatsApp message) sent once a student's
    access to a course becomes active.

    Both carry the course's WhatsApp group invite link. Delivery runs after
    the response is returned so a slow or failing SMTP/Twilio call never
    blocks or breaks the admin's approval request. ORM attributes are read
    here, while the session is still open, rather than inside the tasks.
    """
    if not user or not course:
        return

    student_name = user.full_name or user.username
    invite_link = course.whatsapp_invite_link

    if user.email:
        background_tasks.add_task(
            email_service.send_enrollment_welcome_email,
            to_email=user.email,
            student_name=student_name,
            course_name=course.name,
            whatsapp_invite_link=invite_link,
        )

    if user.phone_number:
        background_tasks.add_task(
            whatsapp_service.send_welcome_message,
            phone_number=user.phone_number,
            course_name=course.name,
            invite_link=invite_link,
        )

def create_enrollment(
    db: Session,
    user: User,
    course_id: int,
    payment_proof_url: str | None = None,
    payment_proof_name: str | None = None,
):
    # check if enrollment already exists
    enrollment = db.query(Enrollment).filter(
        Enrollment.user_id == user.id,
        Enrollment.course_id == course_id
    ).first()

    if enrollment:
        return enrollment

    # create new enrollment
    enrollment = Enrollment(
        user_id=user.id,
        course_id=course_id,
        payment_proof_url=payment_proof_url,
        payment_proof_name=payment_proof_name,
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

def course_progress(db: Session, user_id: int, course_ids: list[int]) -> dict[int, tuple[int, int]]:
    """Per course: (percent of assignments and quizzes submitted, number submitted)."""
    if not course_ids:
        return {}
    totals: dict[int, int] = {course_id: 0 for course_id in course_ids}
    done: dict[int, int] = {course_id: 0 for course_id in course_ids}

    for course_id, count in (
        db.query(Homework.course_id, func.count(Homework.id))
        .filter(Homework.course_id.in_(course_ids))
        .group_by(Homework.course_id)
    ):
        totals[course_id] += count
    for course_id, count in (
        db.query(Quiz.course_id, func.count(Quiz.id))
        .filter(Quiz.course_id.in_(course_ids))
        .group_by(Quiz.course_id)
    ):
        totals[course_id] += count
    for course_id, count in (
        db.query(Homework.course_id, func.count(HomeworkSubmission.id))
        .join(HomeworkSubmission, HomeworkSubmission.homework_id == Homework.id)
        .filter(Homework.course_id.in_(course_ids), HomeworkSubmission.user_id == user_id)
        .group_by(Homework.course_id)
    ):
        done[course_id] += count
    for course_id, count in (
        db.query(Quiz.course_id, func.count(QuizSubmission.id))
        .join(QuizSubmission, QuizSubmission.quiz_id == Quiz.id)
        .filter(Quiz.course_id.in_(course_ids), QuizSubmission.user_id == user_id)
        .group_by(Quiz.course_id)
    ):
        done[course_id] += count

    return {
        course_id: (round(100 * done[course_id] / totals[course_id]) if totals[course_id] else 0, done[course_id])
        for course_id in course_ids
    }


def get_user_courses_with_progress(db: Session, user: User):
    query = db.query(Enrollment).filter(Enrollment.user_id == user.id)
    # TA course assignments are authorization records, not purchases.
    if not user.is_ta:
        query = query.filter(Enrollment.paid.is_(True))
    enrollments = query.all()
    progress = course_progress(db, user.id, [e.course_id for e in enrollments])

    return [
        EnrolledCourseBase(
            id=e.course.id,
            name=e.course.name,
            code=e.course.code,
            progress=progress.get(e.course_id, (0, 0))[0],
            completed=progress.get(e.course_id, (0, 0))[1],
        )
        for e in enrollments
    ]


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
        paid_at=datetime.utcnow() if paid else None,
        # Enrolled by an admin: the first month starts now (crud/billing.py).
        paid_until=datetime.now(timezone.utc) + timedelta(days=30) if paid else None,
    )
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)

    return enrollment, None
