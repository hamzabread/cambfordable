from sqlalchemy.orm import Session
from models.homeworks import Homework, HomeworkSubmission
from schemas.homeworks import HomeworkCreate, HomeworkSubmissionCreate
from datetime import datetime, timezone

def create_homework(db: Session, homework_in: HomeworkCreate):
    homework = Homework(**homework_in.dict())
    db.add(homework)
    db.commit()
    db.refresh(homework)
    return homework

def get_course_homeworks(db: Session, course_id: int):
    return db.query(Homework).filter(Homework.course_id == course_id).all()

def submit_homework(db: Session, homework_id: int, user_id: int, submission_in: HomeworkSubmissionCreate):
    submission = HomeworkSubmission(
        homework_id=homework_id,
        user_id=user_id,
        file_url=submission_in.file_url,
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