from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from database import get_db
from core.security import get_current_admin, get_current_user, get_current_admin_or_ta
from models.users import User
from models.quiz import Quiz
from models.quiz_question import QuizQuestion
from models.quiz_submission import QuizSubmission
from schemas.quizzes import QuizCreate
from crud.quizzes import create_quiz, list_course_quizzes, get_quiz_for_student
from routers.uploads import QUIZ_IMAGES_DIR, SOLUTIONS_UPLOAD_DIR, save_file

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


@router.get("/{quiz_id}/title")
def get_quiz_title(quiz_id: int, db: Session = Depends(get_db), user = Depends(get_current_user)):
    """Get quiz title for students viewing their grades (bypasses deadline check)"""
    from models.quiz import Quiz
    
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    return {"id": quiz.id, "title": quiz.title}


# Upload image to quiz question
@router.post("/questions/{question_id}/image")
async def upload_quiz_question_image(
    question_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Upload an image for a quiz question"""
    # Verify question exists
    question = db.query(QuizQuestion).filter(QuizQuestion.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Quiz question not found")
    
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
    file_path = save_file(file, QUIZ_IMAGES_DIR)
    image_url = f"/{file_path}"
    
    # Update question with image URL
    question.image_url = image_url
    db.commit()
    
    return {
        "message": "Image uploaded successfully",
        "image_url": image_url,
        "question_id": question_id
    }


# ── Solution file management (Admin / TA) ──────────────────

@router.post("/{quiz_id}/solution")
async def upload_quiz_solution(
    quiz_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_admin_or_ta),
):
    """Upload a solution file for a quiz (visible to all students who submitted)"""
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    file_path = save_file(file, SOLUTIONS_UPLOAD_DIR)
    quiz.solution_url = f"/{file_path}"
    db.commit()

    return {
        "message": "Solution uploaded successfully",
        "solution_url": quiz.solution_url,
        "quiz_id": quiz_id,
    }


@router.delete("/{quiz_id}/solution")
def remove_quiz_solution(
    quiz_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_admin_or_ta),
):
    """Remove a solution file from a quiz"""
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    quiz.solution_url = None
    db.commit()

    return {"message": "Solution removed", "quiz_id": quiz_id}


@router.get("/{quiz_id}/solution")
def get_quiz_solution(
    quiz_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Get the solution URL for a quiz.
    Only accessible by students who have submitted the quiz, or admin/TA.
    """
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    if not quiz.solution_url:
        raise HTTPException(status_code=404, detail="No solution uploaded for this quiz")

    # Admin / TA can always view
    if not (user.is_admin or getattr(user, "is_ta", False)):
        # Student must have submitted to view solution
        submission = db.query(QuizSubmission).filter(
            QuizSubmission.quiz_id == quiz_id,
            QuizSubmission.user_id == user.id,
        ).first()
        if not submission:
            raise HTTPException(
                status_code=403,
                detail="You must submit the quiz before viewing the solution",
            )

    return {"solution_url": quiz.solution_url, "quiz_id": quiz_id}