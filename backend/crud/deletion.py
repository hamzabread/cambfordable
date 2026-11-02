"""Permanent deletes for the admin tools.

Most foreign keys in this schema don't cascade, so each delete removes the
dependent rows itself, children first, in one transaction. Uploaded files
belonging to deleted rows are removed from disk afterwards (best effort).
"""
import logging
import os

from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from core.zoom_api import delete_zoom_meeting
from models.class_attendance import ClassAttendance
from models.course_threads import CourseThread, ThreadReply
from models.courses import Course
from models.enrollments import Enrollment
from models.homeworks import Homework, HomeworkSubmission
from models.live_class_messages import LiveClassMessage
from models.live_class_sessions import LiveClassSession
from models.live_classes import LiveClass
from models.notifications import Notification
from models.payment_proof import PaymentProof
from models.payments import Payment
from models.quiz import Quiz
from models.quiz_answer import QuizAnswer
from models.quiz_attempt import QuizAttempt
from models.quiz_option import QuizOption
from models.quiz_question import QuizQuestion
from models.quiz_submission import QuizSubmission
from models.users import User

logger = logging.getLogger(__name__)


class Files:
    """Collects upload paths to delete once the database change has committed."""

    def __init__(self):
        self.paths: set[str] = set()

    def add(self, *urls: str | None):
        for url in urls:
            if not url:
                continue
            path = url.replace("\\", "/").lstrip("/")
            root = os.path.realpath("uploads")
            # Only files stored under uploads/, never anything a stored URL points outside it.
            if path.startswith("uploads/") and os.path.realpath(path).startswith(root + os.sep):
                self.paths.add(path)

    def remove(self):
        for path in self.paths:
            try:
                os.remove(path)
            except FileNotFoundError:
                pass
            except OSError as error:
                logger.warning("Could not delete %s: %s", path, error)


def _has_table(db: Session, name: str) -> bool:
    return name in inspect(db.get_bind()).get_table_names()


def _purge_quiz(db: Session, quiz: Quiz, files: Files) -> None:
    submission_ids = [row[0] for row in db.query(QuizSubmission.id).filter(QuizSubmission.quiz_id == quiz.id)]
    if submission_ids:
        for answer in db.query(QuizAnswer).filter(QuizAnswer.submission_id.in_(submission_ids)):
            files.add(answer.uploaded_file_url)
        db.query(QuizAnswer).filter(QuizAnswer.submission_id.in_(submission_ids)).delete(synchronize_session=False)
    db.query(QuizSubmission).filter(QuizSubmission.quiz_id == quiz.id).delete(synchronize_session=False)
    db.query(QuizAttempt).filter(QuizAttempt.quiz_id == quiz.id).delete(synchronize_session=False)
    question_ids = [row[0] for row in db.query(QuizQuestion.id).filter(QuizQuestion.quiz_id == quiz.id)]
    if question_ids:
        for question in db.query(QuizQuestion).filter(QuizQuestion.id.in_(question_ids)):
            files.add(question.image_url)
        db.query(QuizAnswer).filter(QuizAnswer.question_id.in_(question_ids)).delete(synchronize_session=False)
        db.query(QuizOption).filter(QuizOption.question_id.in_(question_ids)).delete(synchronize_session=False)
    db.query(QuizQuestion).filter(QuizQuestion.quiz_id == quiz.id).delete(synchronize_session=False)
    files.add(quiz.solution_url)
    db.delete(quiz)


def _purge_homework(db: Session, homework: Homework, files: Files) -> None:
    for submission in db.query(HomeworkSubmission).filter(HomeworkSubmission.homework_id == homework.id):
        files.add(submission.file_url)
    db.query(HomeworkSubmission).filter(HomeworkSubmission.homework_id == homework.id).delete(synchronize_session=False)
    files.add(homework.image_url, homework.solution_url)
    db.delete(homework)


def _purge_live_class(db: Session, live_class: LiveClass, files: Files) -> None:
    db.query(LiveClassMessage).filter(LiveClassMessage.live_class_id == live_class.id).delete(synchronize_session=False)
    db.query(LiveClassSession).filter(LiveClassSession.live_class_id == live_class.id).delete(synchronize_session=False)
    db.query(ClassAttendance).filter(ClassAttendance.live_class_id == live_class.id).delete(synchronize_session=False)
    if _has_table(db, "class_materials"):
        db.execute(text("DELETE FROM class_materials WHERE live_class_id = :id"), {"id": live_class.id})
    files.add(live_class.attachment_url)
    db.delete(live_class)


def _purge_threads(db: Session, thread_filter) -> None:
    thread_ids = [row[0] for row in db.query(CourseThread.id).filter(thread_filter)]
    if thread_ids:
        db.query(ThreadReply).filter(ThreadReply.thread_id.in_(thread_ids)).delete(synchronize_session=False)
        db.query(CourseThread).filter(CourseThread.id.in_(thread_ids)).delete(synchronize_session=False)


def delete_quiz(db: Session, quiz: Quiz) -> None:
    files = Files()
    _purge_quiz(db, quiz, files)
    db.commit()
    files.remove()


def delete_homework(db: Session, homework: Homework) -> None:
    files = Files()
    _purge_homework(db, homework, files)
    db.commit()
    files.remove()


def delete_live_class(db: Session, live_class: LiveClass, cancel_zoom: bool = True) -> None:
    files = Files()
    meeting_id = live_class.meeting_id
    _purge_live_class(db, live_class, files)
    db.commit()
    files.remove()
    if cancel_zoom and meeting_id:
        delete_zoom_meeting(meeting_id)


def delete_course(db: Session, course: Course) -> dict:
    """Removes the course and everything in it: classes, quizzes, homework,
    questions, enrollments and payment records."""
    files = Files()
    counts = {"quizzes": 0, "homework": 0, "classes": 0, "enrollments": 0}
    meeting_ids = []
    for quiz in db.query(Quiz).filter(Quiz.course_id == course.id).all():
        _purge_quiz(db, quiz, files)
        counts["quizzes"] += 1
    for homework in db.query(Homework).filter(Homework.course_id == course.id).all():
        _purge_homework(db, homework, files)
        counts["homework"] += 1
    for live_class in db.query(LiveClass).filter(LiveClass.course_id == course.id).all():
        meeting_ids.append(live_class.meeting_id)
        _purge_live_class(db, live_class, files)
        counts["classes"] += 1
    _purge_threads(db, CourseThread.course_id == course.id)
    for proof in db.query(PaymentProof).filter(PaymentProof.course_id == course.id):
        files.add(proof.file_url)
    db.query(PaymentProof).filter(PaymentProof.course_id == course.id).delete(synchronize_session=False)
    db.query(Payment).filter(Payment.course_id == course.id).delete(synchronize_session=False)
    for enrollment in db.query(Enrollment).filter(Enrollment.course_id == course.id):
        files.add(enrollment.payment_proof_url)
    counts["enrollments"] = db.query(Enrollment).filter(Enrollment.course_id == course.id).delete(synchronize_session=False)
    db.delete(course)
    db.commit()
    files.remove()
    for meeting_id in meeting_ids:
        if meeting_id:
            delete_zoom_meeting(meeting_id)
    return counts


def delete_user(db: Session, user: User) -> None:
    """Removes the account and everything they submitted or uploaded."""
    files = Files()
    submission_ids = [row[0] for row in db.query(QuizSubmission.id).filter(QuizSubmission.user_id == user.id)]
    if submission_ids:
        for answer in db.query(QuizAnswer).filter(QuizAnswer.submission_id.in_(submission_ids)):
            files.add(answer.uploaded_file_url)
        db.query(QuizAnswer).filter(QuizAnswer.submission_id.in_(submission_ids)).delete(synchronize_session=False)
        db.query(QuizSubmission).filter(QuizSubmission.id.in_(submission_ids)).delete(synchronize_session=False)
    db.query(QuizAttempt).filter(QuizAttempt.user_id == user.id).delete(synchronize_session=False)
    for submission in db.query(HomeworkSubmission).filter(HomeworkSubmission.user_id == user.id):
        files.add(submission.file_url)
    db.query(HomeworkSubmission).filter(HomeworkSubmission.user_id == user.id).delete(synchronize_session=False)
    db.query(LiveClassMessage).filter(LiveClassMessage.user_id == user.id).delete(synchronize_session=False)
    db.query(LiveClassSession).filter(LiveClassSession.user_id == user.id).delete(synchronize_session=False)
    db.query(ClassAttendance).filter(ClassAttendance.user_id == user.id).delete(synchronize_session=False)
    db.query(ThreadReply).filter(ThreadReply.author_id == user.id).delete(synchronize_session=False)
    _purge_threads(db, CourseThread.author_id == user.id)
    for proof in db.query(PaymentProof).filter(PaymentProof.user_id == user.id):
        files.add(proof.file_url)
    db.query(PaymentProof).filter(PaymentProof.user_id == user.id).delete(synchronize_session=False)
    db.query(Payment).filter(Payment.user_id == user.id).delete(synchronize_session=False)
    for enrollment in db.query(Enrollment).filter(Enrollment.user_id == user.id):
        files.add(enrollment.payment_proof_url)
    db.query(Enrollment).filter(Enrollment.user_id == user.id).delete(synchronize_session=False)
    db.query(Notification).filter(Notification.user_id == user.id).delete(synchronize_session=False)
    db.delete(user)
    db.commit()
    files.remove()
