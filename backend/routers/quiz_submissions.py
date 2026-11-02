from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from core.security import get_current_user, get_current_admin, get_current_admin_or_ta
from schemas.quiz_submissions import QuizSubmit, GradeQuiz
from crud.quiz_submissions import submit_quiz, get_submissions_for_quiz, grade_submission, get_submission_with_answers
from models.enrollments import Enrollment
from models.quiz import Quiz
from models.quiz_submission import QuizSubmission
from crud.notifications import notify_grade_update

router = APIRouter(prefix="/quiz-submissions", tags=["Quiz Submissions"])

@router.post("/")
def submit_quiz_endpoint(
    payload: QuizSubmit,
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
):
    quiz = db.query(Quiz).filter(Quiz.id == payload.quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    if not user.is_admin:
        enrollment_query = db.query(Enrollment).filter(
            Enrollment.user_id == user.id,
            Enrollment.course_id == quiz.course_id,
        )
        if not user.is_ta:
            enrollment_query = enrollment_query.filter(Enrollment.paid.is_(True))
        if not enrollment_query.first():
            raise HTTPException(status_code=403, detail="You do not have access to this quiz")
    return submit_quiz(db, user.id, payload)

@router.get("/quiz/{quiz_id}")
def get_all_submissions(
    quiz_id: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_admin_or_ta),
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    if not user.is_admin and not db.query(Enrollment).filter(
        Enrollment.user_id == user.id,
        Enrollment.course_id == quiz.course_id,
    ).first():
        raise HTTPException(status_code=403, detail="You do not have access to this course")
    return get_submissions_for_quiz(db, quiz_id)

@router.post("/grade")
def grade_quiz(
    payload: GradeQuiz,
    db: Session = Depends(get_db),
    user = Depends(get_current_admin_or_ta),
):
    submission = db.query(QuizSubmission).filter(
        QuizSubmission.id == payload.submission_id
    ).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    if not user.is_admin:
        enrollment = db.query(Enrollment).filter(
            Enrollment.user_id == user.id,
            Enrollment.course_id == submission.quiz.course_id,
        ).first()
        if not enrollment:
            raise HTTPException(status_code=403, detail="You do not have access to this course")
    if payload.score < 0 or payload.score > submission.quiz.total_marks:
        raise HTTPException(
            status_code=422,
            detail=f"Score must be between 0 and {submission.quiz.total_marks}",
        )
    old_score, old_remark = submission.score, submission.remarks
    result = grade_submission(db, payload)
    db.refresh(submission)
    notify_grade_update(
        db,
        user_id=submission.user_id,
        item_kind="Quiz",
        item_title=submission.quiz.title,
        old_score=old_score,
        new_score=submission.score,
        old_remark=old_remark,
        new_remark=submission.remarks,
    )
    return result

@router.get("/me/{quiz_id}")
def get_my_result(
    quiz_id: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
):
    from crud.quiz_submissions import get_student_quiz_result
    return get_student_quiz_result(db, quiz_id, user.id)

@router.get("/{submission_id}/answers")
def view_submission_answers(
    submission_id: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_admin_or_ta),
):
    submission = db.query(QuizSubmission).filter(QuizSubmission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    if not user.is_admin and not db.query(Enrollment).filter(
        Enrollment.user_id == user.id,
        Enrollment.course_id == submission.quiz.course_id,
    ).first():
        raise HTTPException(status_code=403, detail="You do not have access to this course")
    return get_submission_with_answers(db, submission_id)
