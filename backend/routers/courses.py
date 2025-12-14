from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from core.security import get_current_user
from models.users import User
from crud.enrollments import (
    enroll_user_in_course,
    get_user_enrollments,
)
from schemas.courses import CourseOut

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


@router.get("/me", response_model=list[CourseOut])
def my_courses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    enrollments = get_user_enrollments(db, current_user)

    return [
        CourseOut(
            id=e.course.id,
            name=e.course.name,
            code=e.course.code,
            progress=e.progress,
            completed=e.completed,
        )
        for e in enrollments
    ]
