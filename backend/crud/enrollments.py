from sqlalchemy.orm import Session
from models.enrollments import Enrollment
from models.courses import Course
from models.users import User
from schemas.courses import CourseOut, EnrolledCourseBase
from core.whatsapp import whatsapp_service

def create_enrollment(db: Session, user: User, course_id: int):
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
    )
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    
    # Send WhatsApp welcome message with group invite link
    course = db.query(Course).filter(Course.id == course_id).first()
    if course and user.phone_number:
        whatsapp_service.send_welcome_message(
            phone_number=user.phone_number,
            course_name=course.name,
            invite_link=course.whatsapp_invite_link,  # may be None
        )

    return enrollment




def get_user_enrollments(db: Session, user: User):
    return (
        db.query(Enrollment)
        .filter(Enrollment.user_id == user.id)
        .all()
    )

def get_user_courses_with_progress(db: Session, user: User):
    enrollments = (
        db.query(Enrollment)
        .filter(Enrollment.user_id == user.id)
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


def admin_enroll_user(
    db: Session,
    user_id: int,
    course_id: int,
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
    )
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)

    return enrollment, None