from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from models.homeworks import HomeworkSubmission, Homework
from routers.uploads import HOMEWORK_UPLOAD_DIR, HOMEWORK_IMAGES_DIR, save_file
from routers.uploads import SOLUTIONS_UPLOAD_DIR
from database import get_db
from crud.homeworks import create_homework, get_course_homeworks, grade_homework_submission, submit_homework, get_user_homework_submissions, get_homework_submissions
from schemas.homeworks import HomeworkCreate, HomeworkGrade, HomeworkOut, HomeworkSubmissionCreate, HomeworkSubmissionOut
from core.security import get_current_admin, get_current_admin_or_ta, get_current_user
from models.users import User

router = APIRouter(prefix="/homeworks", tags=["Homeworks"])

# Create homework (admin)
@router.post("/", response_model=HomeworkOut)
def admin_create_homework(homework_in: HomeworkCreate, db: Session = Depends(get_db)):
    return create_homework(db, homework_in)

# List homework for a course
@router.get("/course/{course_id}", response_model=list[HomeworkOut])
def list_course_homework(course_id: int, db: Session = Depends(get_db)):
    return get_course_homeworks(db, course_id)

# List current user's submissions
@router.get("/me", response_model=list[HomeworkSubmissionOut])
def my_submissions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_user_homework_submissions(db, current_user.id)


# routers/homeworks.py
@router.get("/{homework_id}/submissions", response_model=list[HomeworkSubmissionOut])
def list_homework_submissions(
    homework_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_admin_or_ta)
):
    # Call the CRUD function
    return get_homework_submissions(db, homework_id)

@router.post("/grade", response_model=HomeworkSubmissionOut)
def grade_homework(
    payload: HomeworkGrade,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_admin_or_ta)
):
    submission = grade_homework_submission(db, payload)
    if not submission:
        raise HTTPException(
            status_code=404, 
            detail="Homework submission not found"
        )
    return submission

@router.post("/{homework_id}/submit")
async def submit_homework_endpoint(
    homework_id: int, 
    file: UploadFile = File(...), 
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    # 1. Save file to the CORRECT directory (uploads/homeworks)
    file_path = save_file(file, HOMEWORK_UPLOAD_DIR)
    
    # 2. Ensure path starts with a slash for the frontend
    formatted_path = f"/{file_path}" # Result: /uploads/homeworks/filename_uuid.ext
    
    # 3. Save to Database
    submission = HomeworkSubmission(
        homework_id=homework_id,
        user_id=user.id,
        file_url=formatted_path, # This is the critical part
        submitted_at=datetime.now(timezone.utc)
    )
    db.add(submission)
    db.commit()
    return {"message": "Submitted successfully", "url": formatted_path}


# Upload image to homework question
@router.post("/{homework_id}/image")
async def upload_homework_image(
    homework_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Upload an image for a homework question"""
    # Verify homework exists
    homework = db.query(Homework).filter(Homework.id == homework_id).first()
    if not homework:
        raise HTTPException(status_code=404, detail="Homework not found")
    
    # Validate file type
    allowed_types = {"image/jpeg", "image/png", "image/jpg"}
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only JPEG and PNG images are allowed")
    
    # Validate file size (max 10MB)
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    if file_size > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File size exceeds 10MB limit")
    
    # Save image
    file_path = save_file(file, HOMEWORK_IMAGES_DIR)
    image_url = f"/{file_path}"
    
    # Update homework with image URL
    homework.image_url = image_url
    db.commit()
    
    return {
        "message": "Image uploaded successfully",
        "image_url": image_url,
        "homework_id": homework_id
    }


# ── Solution file management (Admin / TA) ──────────────────

@router.post("/{homework_id}/solution")
async def upload_homework_solution(
    homework_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_admin_or_ta),
):
    """Upload a solution file for a homework (visible to all students who submitted)"""
    homework = db.query(Homework).filter(Homework.id == homework_id).first()
    if not homework:
        raise HTTPException(status_code=404, detail="Homework not found")

    file_path = save_file(file, SOLUTIONS_UPLOAD_DIR)
    homework.solution_url = f"/{file_path}"
    db.commit()

    return {
        "message": "Solution uploaded successfully",
        "solution_url": homework.solution_url,
        "homework_id": homework_id,
    }


@router.delete("/{homework_id}/solution")
def remove_homework_solution(
    homework_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_admin_or_ta),
):
    """Remove a solution file from a homework"""
    homework = db.query(Homework).filter(Homework.id == homework_id).first()
    if not homework:
        raise HTTPException(status_code=404, detail="Homework not found")

    homework.solution_url = None
    db.commit()

    return {"message": "Solution removed", "homework_id": homework_id}


@router.get("/{homework_id}/solution")
def get_homework_solution(
    homework_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Get the solution URL for a homework.
    Only accessible by students who have submitted, or admin/TA.
    """
    homework = db.query(Homework).filter(Homework.id == homework_id).first()
    if not homework:
        raise HTTPException(status_code=404, detail="Homework not found")

    if not homework.solution_url:
        raise HTTPException(status_code=404, detail="No solution uploaded for this homework")

    # Admin / TA can always view
    if not (user.is_admin or getattr(user, "is_ta", False)):
        submission = db.query(HomeworkSubmission).filter(
            HomeworkSubmission.homework_id == homework_id,
            HomeworkSubmission.user_id == user.id,
        ).first()
        if not submission:
            raise HTTPException(
                status_code=403,
                detail="You must submit the homework before viewing the solution",
            )

    return {"solution_url": homework.solution_url, "homework_id": homework_id}