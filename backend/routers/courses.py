from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from core.security import get_current_user, get_current_admin
from models.users import User
from crud.enrollments import (
    enroll_user_in_course,
    get_user_enrollments,
    get_user_courses_with_progress,
)
from schemas.courses import CourseOut, EnrolledCourseBase
from crud.courses import get_all_courses, create_course

router = APIRouter(prefix="/courses", tags=["Courses"])


@router.post("/{course_id}/enroll")
def enroll_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    enrollment = enroll_user_in_course(db, current_user, course_id)
    if not enrollment:
        raise HTTPException(status_code=404, detail="Course not found")

    return {"message": "Enrolled successfully"}


@router.get("/me", response_model=list[EnrolledCourseBase])
def my_courses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_user_courses_with_progress(db, current_user)



@router.get("/", response_model=list[CourseOut])
def list_courses(db: Session = Depends(get_db)):
    return get_all_courses(db)

@router.post("/", response_model=CourseOut)
def admin_create_course(
    course_in: CourseOut,
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin)
):
    return create_course(db, course_in )
