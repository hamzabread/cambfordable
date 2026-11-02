from sqlalchemy.orm import Session

from models.enrollments import Enrollment
from models.homeworks import Homework, HomeworkSubmission
from models.payment_proof import PaymentProof
from models.live_classes import LiveClass
from models.quiz import Quiz
from models.quiz_answer import QuizAnswer
from models.quiz_question import QuizQuestion
from models.quiz_submission import QuizSubmission
from models.users import User


def _rows_for_file(db: Session, model, column, filename: str) -> list:
    """Rows whose stored URL points at this file. URLs saved on Windows contain backslashes."""
    rows = db.query(model).filter(column.contains(filename, autoescape=True)).all()
    return [
        row for row in rows
        if (getattr(row, column.key) or "").replace("\\", "/").rsplit("/", 1)[-1] == filename
    ]


def _is_course_staff(db: Session, user: User, course_id: int) -> bool:
    if not user.is_ta:
        return False
    return db.query(Enrollment).filter(
        Enrollment.user_id == user.id,
        Enrollment.course_id == course_id,
    ).first() is not None


def _has_course_access(db: Session, user: User, course_id: int) -> bool:
    if _is_course_staff(db, user, course_id):
        return True
    return db.query(Enrollment).filter(
        Enrollment.user_id == user.id,
        Enrollment.course_id == course_id,
        Enrollment.paid.is_(True),
    ).first() is not None


def _can_read_payment_proof(db: Session, user: User, filename: str) -> bool:
    rows = _rows_for_file(db, Enrollment, Enrollment.payment_proof_url, filename)
    rows += _rows_for_file(db, PaymentProof, PaymentProof.file_url, filename)
    return any(row.user_id == user.id for row in rows)


def _can_read_homework_submission(db: Session, user: User, filename: str) -> bool:
    rows = _rows_for_file(db, HomeworkSubmission, HomeworkSubmission.file_url, filename)
    return any(
        row.user_id == user.id or _is_course_staff(db, user, row.homework.course_id)
        for row in rows
    )


def _can_read_homework_image(db: Session, user: User, filename: str) -> bool:
    rows = _rows_for_file(db, Homework, Homework.image_url, filename)
    return any(_has_course_access(db, user, row.course_id) for row in rows)


def _can_read_quiz_image(db: Session, user: User, filename: str) -> bool:
    rows = _rows_for_file(db, QuizQuestion, QuizQuestion.image_url, filename)
    return any(_has_course_access(db, user, row.quiz.course_id) for row in rows)


def _can_read_quiz_answer(db: Session, user: User, filename: str) -> bool:
    rows = _rows_for_file(db, QuizAnswer, QuizAnswer.uploaded_file_url, filename)
    return any(
        row.submission.user_id == user.id
        or _is_course_staff(db, user, row.submission.quiz.course_id)
        for row in rows
    )


def _can_read_solution(db: Session, user: User, filename: str) -> bool:
    """Staff can always read a solution; students only after submitting."""
    for homework in _rows_for_file(db, Homework, Homework.solution_url, filename):
        if _is_course_staff(db, user, homework.course_id):
            return True
        if db.query(HomeworkSubmission).filter(
            HomeworkSubmission.homework_id == homework.id,
            HomeworkSubmission.user_id == user.id,
        ).first():
            return True

    for quiz in _rows_for_file(db, Quiz, Quiz.solution_url, filename):
        if _is_course_staff(db, user, quiz.course_id):
            return True
        if db.query(QuizSubmission).filter(
            QuizSubmission.quiz_id == quiz.id,
            QuizSubmission.user_id == user.id,
        ).first():
            return True

    return False


def _can_read_class_attachment(db: Session, user: User, filename: str) -> bool:
    rows = _rows_for_file(db, LiveClass, LiveClass.attachment_url, filename)
    return any(_has_course_access(db, user, row.course_id) for row in rows)


_ACCESS_RULES = {
    "payments": _can_read_payment_proof,
    "homeworks": _can_read_homework_submission,
    "homework_images": _can_read_homework_image,
    "quiz_images": _can_read_quiz_image,
    "quiz_answers": _can_read_quiz_answer,
    "solutions": _can_read_solution,
    "live_classes": _can_read_class_attachment,
}


def can_read_upload(db: Session, user: User, category: str, filename: str) -> bool:
    if user.is_admin:
        return True
    rule = _ACCESS_RULES.get(category)
    return bool(rule and rule(db, user, filename))
