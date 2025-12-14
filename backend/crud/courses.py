from sqlalchemy.orm import Session
from model.courses import Course
from model.users import User

def enroll_user_in_course(db: Session, user: User, course_id: int):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        return None

    if course in user.courses:
        return course

    user.courses.append(course)
    db.commit()
    return course

def get_user_courses(db: Session, user: User):
    return user.courses