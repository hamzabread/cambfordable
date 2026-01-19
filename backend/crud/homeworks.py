from sqlalchemy.orm import Session
from models.homeworks import Homework, HomeworkSubmission
from schemas.homeworks import HomeworkCreate, HomeworkGrade, HomeworkSubmissionCreate
from datetime import datetime, timezone

def create_homework(db: Session, homework_in: HomeworkCreate):
    homework = Homework(**homework_in.dict())
    db.add(homework)
    db.commit()
    db.refresh(homework)
    return homework

def get_course_homeworks(db: Session, course_id: int):
    return db.query(Homework).filter(Homework.course_id == course_id).all()

# crud/homeworks.py

def submit_homework(db: Session, homework_id: int, user_id: int, submission_in: HomeworkSubmissionCreate):
    # Ensure we store the path correctly. 
    # If the frontend sends "/uploads/homeworks/file.pdf", we store that.
    # If the frontend sends just "file.pdf", we fix it here:
    file_path = submission_in.file_url
    if not file_path.startswith("/uploads/"):
        # Fallback if your frontend is only sending the filename
        file_path = f"/uploads/homeworks/{file_path}"

    submission = HomeworkSubmission(
        homework_id=homework_id,
        user_id=user_id,
        file_url=file_path, 
        submitted_at=datetime.now(timezone.utc)
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return submission

def get_user_homework_submissions(db: Session, user_id: int):
    return db.query(HomeworkSubmission).filter(HomeworkSubmission.user_id == user_id).all()


def get_homework_submissions(db: Session, homework_id: int):
    return db.query(HomeworkSubmission).filter(HomeworkSubmission.homework_id == homework_id).all()

# crud/homeworks.py
def grade_homework_submission(db: Session, payload: HomeworkGrade):
    submission = db.query(HomeworkSubmission).filter(HomeworkSubmission.id == payload.submission_id).first()
    if not submission:
        return None
    
    submission.remark = payload.remark
    submission.score = payload.score
    db.commit()
    db.refresh(submission)
    return submission