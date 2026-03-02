from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from database import get_db
from core.security import get_current_admin, get_current_user
from models.users import User
from models.quiz_question import QuizQuestion
from schemas.quizzes import QuizCreate
from crud.quizzes import create_quiz, list_course_quizzes, get_quiz_for_student
from routers.uploads import QUIZ_IMAGES_DIR, save_file

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