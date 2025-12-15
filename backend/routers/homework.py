from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from database import get_db
from crud.homeworks import create_homework, get_course_homeworks, submit_homework, get_user_homework_submissions, get_homework_submissions
from schemas.homeworks import HomeworkCreate, HomeworkOut, HomeworkSubmissionCreate, HomeworkSubmissionOut
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
@router.post("/{homework_id}/submit", response_model=HomeworkSubmissionOut)
def submit_homework_file(homework_id: int, file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # You would save the file to your server or S3 and get `file_url`
    file_url = f"/uploads/{file.filename}"  # Example placeholder
    submission_in = HomeworkSubmissionCreate(file_url=file_url)
    return submit_homework(db, homework_id, current_user.id, submission_in)

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
