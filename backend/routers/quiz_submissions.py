from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from core.security import get_current_user, get_current_admin, get_current_admin_or_ta
from schemas.quiz_submissions import QuizSubmit, GradeQuiz
from crud.quiz_submissions import submit_quiz, get_submissions_for_quiz, grade_submission, get_submission_with_answers

router = APIRouter(prefix="/quiz-submissions", tags=["Quiz Submissions"])

@router.post("/")
def submit_quiz_endpoint(
    payload: QuizSubmit,
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
):
    return submit_quiz(db, user.id, payload)

@router.get("/quiz/{quiz_id}")
def get_all_submissions(
    quiz_id: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_admin_or_ta),
):
    return get_submissions_for_quiz(db, quiz_id)

@router.post("/grade")
def grade_quiz(
    payload: GradeQuiz,
    db: Session = Depends(get_db),
    user = Depends(get_current_admin_or_ta),
):
    return grade_submission(db, payload)

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
    return get_submission_with_answers(db, submission_id)
