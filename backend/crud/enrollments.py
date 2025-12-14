from sqlalchemy.orm import Session
from models.enrollments import Enrollment
from models.courses import Course
from models.users import User

def enroll_user_in_course(
    db: Session,
    user: User,
    course_id: int,
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        return None

    existing = (
        db.query(Enrollment)
        .filter(
            Enrollment.user_id == user.id,
            Enrollment.course_id == course_id,
        )
        .first()
    )
    if existing:
        return existing

    enrollment = Enrollment(
        user_id=user.id,
        course_id=course_id,
    )

    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    return enrollment


def get_user_enrollments(db: Session, user: User):
    return (
        db.query(Enrollment)
        .filter(Enrollment.user_id == user.id)
        .all()
    )
