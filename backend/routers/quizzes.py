from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from database import get_db
from core.security import get_current_admin, get_current_user, get_current_admin_or_ta
from models.users import User
from models.quiz import Quiz
from models.quiz_question import QuizQuestion
from models.quiz_submission import QuizSubmission
from models.enrollments import Enrollment
from models.courses import Course
from schemas.quizzes import QuizCreate
from crud.quizzes import create_quiz, list_course_quizzes, get_quiz_for_student
from routers.uploads import DOCUMENT_EXTENSIONS, IMAGE_EXTENSIONS, MB, QUIZ_IMAGES_DIR, SOLUTIONS_UPLOAD_DIR, save_file, validate_upload
from models.quiz_attempt import QuizAttempt
from datetime import timedelta
from crud.notifications import notify_course_students
from crud.deletion import delete_quiz

router = APIRouter(prefix="/quizzes", tags=["Quizzes"])


def _require_quiz_access(db: Session, user: User, quiz_id: int) -> Quiz:
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    if user.is_admin:
        return quiz

    enrollment_query = db.query(Enrollment).filter(
        Enrollment.user_id == user.id,
        Enrollment.course_id == quiz.course_id,
    )
    if not user.is_ta:
        enrollment_query = enrollment_query.filter(Enrollment.paid.is_(True))
    if not enrollment_query.first():
        raise HTTPException(
            status_code=403,
            detail="You don't have access to this quiz. It opens once your enrollment in the course is approved.",
        )
    return quiz


def _attempt_window(quiz: Quiz, attempt: QuizAttempt | None) -> dict:
    if not attempt:
        return {"started_at": None, "ends_at": None}
    started_at = attempt.started_at if attempt.started_at.tzinfo else attempt.started_at.replace(tzinfo=timezone.utc)
    return {
        "started_at": started_at,
        "ends_at": started_at + timedelta(minutes=quiz.duration_minutes),
    }


def _reject_if_submitted(db: Session, user: User, quiz_id: int) -> None:
    if db.query(QuizSubmission).filter(
        QuizSubmission.quiz_id == quiz_id,
        QuizSubmission.user_id == user.id,
    ).first():
        raise HTTPException(status_code=409, detail="You have already submitted this quiz.")

@router.post("/")
def create_quiz_endpoint(
    quiz: QuizCreate,
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin),
):
    course = db.query(Course).filter(Course.id == quiz.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if quiz.deadline and quiz.deadline <= datetime.now(timezone.utc):
        raise HTTPException(status_code=422, detail="Deadline must be in the future")
    result = create_quiz(db, quiz)
    notify_course_students(
        db,
        course_id=quiz.course_id,
        kind="quiz",
        title="New quiz available",
        message=f"{quiz.title} was added to {course.name if course else 'your course'}.",
        href="/quizzes",
    )
    return result


@router.get("/me")
def get_my_quizzes(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    rows = (
        db.query(Quiz, Course, QuizSubmission)
        .join(Course, Course.id == Quiz.course_id)
        .join(Enrollment, Enrollment.course_id == Quiz.course_id)
        .outerjoin(
            QuizSubmission,
            (QuizSubmission.quiz_id == Quiz.id) & (QuizSubmission.user_id == user.id),
        )
        .filter(
            Enrollment.user_id == user.id,
            Enrollment.paid.is_(True),
        )
        .order_by(Quiz.deadline.asc().nullslast(), Quiz.id.desc())
        .all()
    )
    now = datetime.now(timezone.utc)
    items = []
    courses: dict[int, dict] = {}
    for quiz, course, submission in rows:
        courses[course.id] = {"id": course.id, "name": course.name, "code": course.code}
        if submission and submission.score is not None:
            status = "graded"
        elif submission:
            status = "submitted"
        elif quiz.deadline and now > quiz.deadline and not quiz.allow_late:
            status = "closed"
        else:
            status = "available"
        items.append({
            "id": quiz.id,
            "title": quiz.title,
            "course_id": course.id,
            "course_name": course.name,
            "course_code": course.code,
            "total_marks": quiz.total_marks,
            "duration_minutes": quiz.duration_minutes,
            "deadline": quiz.deadline,
            "allow_late": quiz.allow_late,
            "status": status,
            "score": submission.score if submission else None,
            "submitted_at": submission.submitted_at if submission else None,
            "remarks": submission.remarks if submission else None,
        })
    return {"courses": list(courses.values()), "items": items}

@router.get("/course/{course_id}")
def get_course_quizzes(
    course_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not user.is_admin:
        query = db.query(Enrollment).filter(
            Enrollment.user_id == user.id,
            Enrollment.course_id == course_id,
        )
        if not user.is_ta:
            query = query.filter(Enrollment.paid.is_(True))
        if not query.first():
            raise HTTPException(status_code=403, detail="You do not have access to this course")
    return list_course_quizzes(db, course_id)

@router.get("/{quiz_id}")
def view_quiz(quiz_id: int, db: Session = Depends(get_db), user = Depends(get_current_user)):
    quiz = _require_quiz_access(db, user, quiz_id)
    if not (user.is_admin or user.is_ta):
        _reject_if_submitted(db, user, quiz_id)
    data = get_quiz_for_student(db, quiz_id)
    attempt = db.query(QuizAttempt).filter(
        QuizAttempt.quiz_id == quiz_id,
        QuizAttempt.user_id == user.id,
    ).first()
    return {**data, **_attempt_window(quiz, attempt), "server_time": datetime.now(timezone.utc)}


@router.post("/{quiz_id}/start")
def start_quiz(quiz_id: int, db: Session = Depends(get_db), user = Depends(get_current_user)):
    """Record when the student began, so the time limit holds across refreshes."""
    quiz = _require_quiz_access(db, user, quiz_id)
    _reject_if_submitted(db, user, quiz_id)
    get_quiz_for_student(db, quiz_id)  # raises if the quiz is closed
    attempt = db.query(QuizAttempt).filter(
        QuizAttempt.quiz_id == quiz_id,
        QuizAttempt.user_id == user.id,
    ).first()
    if not attempt:
        attempt = QuizAttempt(quiz_id=quiz_id, user_id=user.id, started_at=datetime.now(timezone.utc))
        db.add(attempt)
        db.commit()
        db.refresh(attempt)
    return {**_attempt_window(quiz, attempt), "server_time": datetime.now(timezone.utc)}


@router.get("/{quiz_id}/title")
def get_quiz_title(quiz_id: int, db: Session = Depends(get_db), user = Depends(get_current_user)):
    """Get quiz title for students viewing their grades (bypasses deadline check)"""
    quiz = _require_quiz_access(db, user, quiz_id)
    
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
    
    validate_upload(file, IMAGE_EXTENSIONS, 10 * MB)
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
    quiz = _require_quiz_access(db, user, quiz_id)

    validate_upload(file, DOCUMENT_EXTENSIONS, 20 * MB)
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
    quiz = _require_quiz_access(db, user, quiz_id)

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
    quiz = _require_quiz_access(db, user, quiz_id)

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


@router.delete("/{quiz_id}", status_code=204)
def admin_delete_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Deletes the quiz with its questions, attempts, submissions and grades."""
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    delete_quiz(db, quiz)
