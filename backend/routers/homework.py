from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from models.homeworks import HomeworkSubmission
from routers.uploads import HOMEWORK_UPLOAD_DIR, save_file
from database import get_db
from crud.homeworks import create_homework, get_course_homeworks, grade_homework_submission, submit_homework, get_user_homework_submissions, get_homework_submissions
from schemas.homeworks import HomeworkCreate, HomeworkGrade, HomeworkOut, HomeworkSubmissionCreate, HomeworkSubmissionOut
from core.security import get_current_admin, get_current_user
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

# Submit homework (upload file)
@router.post("/{homework_id}/submit")
async def submit_homework_endpoint(
    homework_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # 1. Save the file using the helper into the homeworks directory
    file_path = save_file(file, HOMEWORK_UPLOAD_DIR)
    
    # 2. Add a leading slash so the frontend sees it as a root-relative path
    # Result: "/uploads/homeworks/filename_uuid.ext"
    db_path = f"/{file_path}"
    
    # 3. Create the submission record in the database
    submission_data = HomeworkSubmissionCreate(file_url=db_path)
    return submit_homework(
        db=db, 
        homework_id=homework_id, 
        user_id=current_user.id, 
        submission_in=submission_data
    )
# List current user's submissions
@router.get("/me", response_model=list[HomeworkSubmissionOut])
def my_submissions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_user_homework_submissions(db, current_user.id)


# routers/homeworks.py
@router.get("/{homework_id}/submissions", response_model=list[HomeworkSubmissionOut])
def list_homework_submissions(
    homework_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin)
):
    # Call the CRUD function
    return get_homework_submissions(db, homework_id)

@router.post("/grade", response_model=HomeworkSubmissionOut)
def grade_homework(
    payload: HomeworkGrade,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin) # Only admins can access this
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