# routers/admin_courses.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from core.security import get_current_admin
from schemas.enrollments import AdminEnrollRequest
from crud.enrollments import admin_enroll_user

router = APIRouter(
    prefix="/admin/courses",
    tags=["Admin Courses"],
)

@router.post("/enroll")
def admin_enroll_student(
    payload: AdminEnrollRequest,
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin),
):
    enrollment, error = admin_enroll_user(
        db,
        user_id=payload.user_id,
        course_id=payload.course_id,
    )

    if error == "user":
        raise HTTPException(status_code=404, detail="User not found")
    if error == "course":
        raise HTTPException(status_code=404, detail="Course not found")
    if error == "exists":
        raise HTTPException(
            status_code=400,
            detail="User already enrolled in this course",
        )

    return {"message": "Student enrolled successfully"}
