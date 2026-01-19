from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from core.security import get_current_admin
from schemas.quizzes import QuizCreate
from crud.quizzes import create_quiz, list_course_quizzes, get_quiz_for_student
from core.security import get_current_user

router = APIRouter(prefix="/quizzes", tags=["Quizzes"])

@router.post("/")
def create_quiz_endpoint(
    quiz: QuizCreate,
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin),
):
    return create_quiz(db, quiz)

@router.get("/course/{course_id}")
def get_course_quizzes(course_id: int, db: Session = Depends(get_db)):
    return list_course_quizzes(db, course_id)

@router.get("/{quiz_id}")
def view_quiz(quiz_id: int, db: Session = Depends(get_db), user = Depends(get_current_user)):
    return get_quiz_for_student(db, quiz_id)