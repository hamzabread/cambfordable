from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_

from database import get_db
from core.security import get_current_user
from models.users import User
from models.enrollments import Enrollment
from models.quiz_submission import QuizSubmission
from models.homeworks import HomeworkSubmission
from models.quiz import Quiz
from models.homeworks import Homework
from models.courses import Course

router = APIRouter(prefix="/ta", tags=["TA"])


@router.get("/pending-quiz-submissions")
def get_pending_quiz_submissions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all pending quiz submissions for courses the TA is enrolled in"""
    
    if not current_user.is_ta:
        raise HTTPException(status_code=403, detail="Only TAs can access this endpoint")
    
    # Get courses the TA is enrolled in
    ta_courses = db.query(Enrollment).filter(
        Enrollment.user_id == current_user.id
    ).all()
    course_ids = [enrollment.course_id for enrollment in ta_courses]
    
    if not course_ids:
        return []
    
    # Get pending quiz submissions from those courses
    pending_submissions = db.query(
        QuizSubmission.id,
        QuizSubmission.quiz_id,
        QuizSubmission.user_id,
        QuizSubmission.submitted_at,
        QuizSubmission.score,
        Quiz.title.label("quiz_title"),
        Quiz.course_id,
        Course.name.label("course_title"),
    ).join(
        Quiz, QuizSubmission.quiz_id == Quiz.id
    ).join(
        Course, Quiz.course_id == Course.id
    ).filter(
        and_(
            Quiz.course_id.in_(course_ids),
            QuizSubmission.score.is_(None),  # Only ungraded submissions
        )
    ).all()

    return [
        {
            "id": sub.id,
            "quiz_id": sub.quiz_id,
            "user_id": sub.user_id,
            "quiz_title": sub.quiz_title,
            "course_id": sub.course_id,
            "course_title": sub.course_title,
            "submitted_at": sub.submitted_at,
            "score": sub.score,
        }
        for sub in pending_submissions
    ]


@router.get("/pending-homework-submissions")
def get_pending_homework_submissions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all pending homework submissions for courses the TA is enrolled in"""
    
    if not current_user.is_ta:
        raise HTTPException(status_code=403, detail="Only TAs can access this endpoint")
    
    # Get courses the TA is enrolled in
    ta_courses = db.query(Enrollment).filter(
        Enrollment.user_id == current_user.id
    ).all()
    course_ids = [enrollment.course_id for enrollment in ta_courses]
    
    if not course_ids:
        return []
    
    # Get pending homework submissions from those courses
    pending_submissions = db.query(
        HomeworkSubmission.id,
        HomeworkSubmission.homework_id,
        HomeworkSubmission.user_id,
        HomeworkSubmission.submitted_at,
        HomeworkSubmission.score,
        Homework.title.label("homework_title"),
        Homework.course_id,
        Course.name.label("course_title"),
    ).join(
        Homework, HomeworkSubmission.homework_id == Homework.id
    ).join(
        Course, Homework.course_id == Course.id
    ).filter(
        and_(
            Homework.course_id.in_(course_ids),
            HomeworkSubmission.score.is_(None),  # Only ungraded submissions
        )
    ).all()

    return [
        {
            "id": sub.id,
            "homework_id": sub.homework_id,
            "user_id": sub.user_id,
            "homework_title": sub.homework_title,
            "course_id": sub.course_id,
            "course_title": sub.course_title,
            "submitted_at": sub.submitted_at,
            "score": sub.score,
        }
        for sub in pending_submissions
    ]


@router.post("/quiz-submissions/{submission_id}/grade")
def grade_quiz_submission(
    submission_id: int,
    score: int,
    remarks: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Grade a quiz submission (TA can only grade for their courses)"""
    
    if not current_user.is_ta:
        raise HTTPException(status_code=403, detail="Only TAs can access this endpoint")
    
    # Get the submission
    submission = db.query(QuizSubmission).filter(
        QuizSubmission.id == submission_id
    ).first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    # Get the quiz
    quiz = db.query(Quiz).filter(Quiz.id == submission.quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    # Check if TA is enrolled in the course
    is_enrolled = db.query(Enrollment).filter(
        and_(
            Enrollment.user_id == current_user.id,
            Enrollment.course_id == quiz.course_id,
        )
    ).first()
    
    if not is_enrolled:
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to grade this submission",
        )
    
    # Update the submission
    submission.score = score
    if remarks:
        submission.remarks = remarks
    
    db.commit()
    return {"message": "Submission graded successfully", "submission_id": submission_id}


@router.post("/homework-submissions/{submission_id}/grade")
def grade_homework_submission(
    submission_id: int,
    score: int,
    remark: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Grade a homework submission (TA can only grade for their courses)"""
    
    if not current_user.is_ta:
        raise HTTPException(status_code=403, detail="Only TAs can access this endpoint")
    
    # Get the submission
    submission = db.query(HomeworkSubmission).filter(
        HomeworkSubmission.id == submission_id
    ).first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    # Get the homework
    homework = db.query(Homework).filter(Homework.id == submission.homework_id).first()
    if not homework:
        raise HTTPException(status_code=404, detail="Homework not found")
    
    # Check if TA is enrolled in the course
    is_enrolled = db.query(Enrollment).filter(
        and_(
            Enrollment.user_id == current_user.id,
            Enrollment.course_id == homework.course_id,
        )
    ).first()
    
    if not is_enrolled:
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to grade this submission",
        )
    
    # Update the submission
    submission.score = score
    if remark:
        submission.remark = remark
    
    db.commit()
    return {"message": "Submission graded successfully", "submission_id": submission_id}
