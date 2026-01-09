from sqlalchemy.orm import Session
from models.enrollments import Enrollment
from models.courses import Course
from models.users import User
from schemas.courses import CourseOut, EnrolledCourseBase

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
