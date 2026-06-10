from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from database import get_db
from core.security import get_current_user, get_current_admin_or_teacher
from models.users import User
from crud.enrollments import (
    create_enrollment,
    get_user_enrollments,
    get_user_courses_with_progress,
)
from crud.enrollments import admin_enroll_user
from schemas.courses import CourseOut, EnrolledCourseBase
from crud.courses import get_all_courses, create_course
from routers.uploads import PAYMENT_UPLOAD_DIR, save_file


router = APIRouter(prefix="/courses", tags=["Courses"])


@router.post("/{course_id}/enroll")
def enroll_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    enrollment = create_enrollment(db, current_user, course_id)
    if not enrollment:
        raise HTTPException(status_code=404, detail="Course not found")

    return {"message": "Enrolled successfully"}


@router.post("/{course_id}/enroll-with-proof")
async def enroll_course_with_proof(
    course_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Read the proof bytes so they can be persisted in the database. Railway's
    # filesystem is ephemeral (wiped on every redeploy), so a disk-only copy is
    # not reliably visible to the admin in production.
    proof_bytes = await file.read()
    if not proof_bytes:
        raise HTTPException(status_code=400, detail="Empty payment proof file")

    # Best-effort disk copy too (useful for local dev / quick preview).
    await file.seek(0)
    try:
        file_path = save_file(file, PAYMENT_UPLOAD_DIR)
        formatted_path = f"/{file_path}"
    except Exception:
        formatted_path = None

    enrollment = create_enrollment(
        db,
        current_user,
        course_id,
        payment_proof_url=formatted_path,
        payment_proof_name=file.filename,
        payment_proof_data=proof_bytes,
        payment_proof_mime=file.content_type or "application/octet-stream",
    )
    if not enrollment:
        raise HTTPException(status_code=404, detail="Course not found")

    return {
        "message": "Payment proof submitted; pending admin approval",
        "payment_proof_name": file.filename,
    }


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
    admin_user: User = Depends(get_current_admin_or_teacher)
):
    # Create the course
    course = create_course(db, course_in)

    # Auto-enroll the creator (admin or teacher) in the course (mark as paid)
    admin_enroll_user(db, user_id=admin_user.id, course_id=course.id, paid=True)
    
    return course


