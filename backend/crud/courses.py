from sqlalchemy.orm import Session
from models.courses import Course
from models.users import User
from schemas.courses import CourseCreate

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

def get_all_courses(db: Session):
    return db.query(Course).all()

def create_course(db: Session, course_in: CourseCreate):
    course = Course(
        name=course_in.name,
        code=course_in.code,
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    return course