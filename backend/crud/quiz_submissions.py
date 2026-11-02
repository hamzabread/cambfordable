from sqlalchemy.orm import Session
from models.quiz import Quiz
from models.quiz_submission import QuizSubmission
from models.quiz_answer import QuizAnswer
from models.quiz_option import QuizOption
from models.quiz_attempt import QuizAttempt
from routers.uploads import quiz_answer_prefix
from schemas.quiz_submissions import QuizSubmit, GradeQuiz
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException

# Thresholds for flagging suspicious activity
TAB_SWITCH_THRESHOLD = 2
FULLSCREEN_EXIT_THRESHOLD = 1

# Slack for network delay after the countdown reaches zero.
TIME_LIMIT_GRACE = timedelta(minutes=2)


def _validate_answers(db: Session, quiz: Quiz, user_id: int, payload: QuizSubmit) -> None:
    """Every answer must belong to this quiz, every option to its question,
    and every file to this student's own quiz-answer uploads."""
    questions = {question.id: question for question in quiz.questions}
    seen: set[int] = set()
    own_prefix = f"/uploads/quiz_answers/{quiz_answer_prefix(user_id)}"
    for answer in payload.answers:
        question = questions.get(answer.question_id)
        if question is None:
            raise HTTPException(status_code=422, detail="An answer refers to a question that isn't in this quiz.")
        if answer.question_id in seen:
            raise HTTPException(status_code=422, detail="A question was answered more than once.")
        seen.add(answer.question_id)

        if question.is_mcq:
            if answer.uploaded_file_url:
                raise HTTPException(status_code=422, detail="Multiple-choice questions take an option, not a file.")
            if answer.selected_option_id is not None and answer.selected_option_id not in {
                option.id for option in question.options
            }:
                raise HTTPException(status_code=422, detail="An answer picks an option from a different question.")
        else:
            if answer.selected_option_id is not None:
                raise HTTPException(status_code=422, detail="File questions take a file, not an option.")
            url = answer.uploaded_file_url
            if url and (not url.startswith(own_prefix) or "/" in url[len("/uploads/quiz_answers/"):]):
                raise HTTPException(status_code=422, detail="Attach a file you uploaded for this quiz.")


def _is_over_time(db: Session, quiz: Quiz, user_id: int, now: datetime) -> bool:
    attempt = db.query(QuizAttempt).filter(
        QuizAttempt.quiz_id == quiz.id,
        QuizAttempt.user_id == user_id,
    ).first()
    if not attempt:
        return False
    started_at = attempt.started_at if attempt.started_at.tzinfo else attempt.started_at.replace(tzinfo=timezone.utc)
    return now > started_at + timedelta(minutes=quiz.duration_minutes) + TIME_LIMIT_GRACE


def submit_quiz(db: Session, user_id: int, payload: QuizSubmit):
    # Check for existing submission
    existing_submission = db.query(QuizSubmission).filter(
        QuizSubmission.quiz_id == payload.quiz_id,
        QuizSubmission.user_id == user_id
    ).first()
    
    if existing_submission:
        raise HTTPException(
            status_code=400, 
            detail="You have already submitted this quiz."
        )
    
    quiz = db.query(Quiz).filter(Quiz.id == payload.quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    now = datetime.now(timezone.utc)
    is_late = False

    if quiz.deadline:
        if now > quiz.deadline:
            if not quiz.allow_late:
                raise HTTPException(
                    status_code=400,
                    detail="Deadline passed. Late submissions not allowed."
                )
            is_late = True

    _validate_answers(db, quiz, user_id, payload)
    over_time = _is_over_time(db, quiz, user_id, now)

    # Determine if submission should be flagged for review
    flagged = (
        payload.tab_switches > TAB_SWITCH_THRESHOLD or
        payload.fullscreen_exits > FULLSCREEN_EXIT_THRESHOLD or
        payload.auto_submitted or
        over_time
    )

    submission = QuizSubmission(
        quiz_id=payload.quiz_id,
        user_id=user_id,
        is_late=is_late,
        tab_switches=payload.tab_switches,
        fullscreen_exits=payload.fullscreen_exits,
        auto_submitted=payload.auto_submitted,
        flagged_for_review=flagged,
    )

    db.add(submission)
    db.commit()
    db.refresh(submission)

    for ans in payload.answers:
        # Extract original filename if it exists
        original_filename = None
        if ans.uploaded_file_url:
            try:
                filename = ans.uploaded_file_url.split("/")[-1]
                filename = filename.removeprefix(quiz_answer_prefix(user_id))
                parts = filename.rsplit("_", 1)
                if len(parts) == 2:
                    name_part = parts[0]
                    ext_part = parts[1]
                    if "." in ext_part:
                        ext = ext_part.split(".", 1)[1]
                        original_filename = f"{name_part}.{ext}"
                    else:
                        original_filename = filename
                else:
                    original_filename = filename
            except:
                original_filename = None
        
        answer = QuizAnswer(
            submission_id=submission.id,
            question_id=ans.question_id,
            selected_option_id=ans.selected_option_id,
            uploaded_file_url=ans.uploaded_file_url,
            original_filename=original_filename,
        )
        db.add(answer)

    db.commit()
    
    return {
        "submission_id": submission.id,
        "is_late": is_late,
        "over_time": over_time,
        "flagged_for_review": flagged,
        "message": "Quiz submitted" + (" (flagged for review)" if flagged else "")
    }


def get_submissions_for_quiz(db: Session, quiz_id: int):
    """Get all submissions with proctoring info"""
    submissions = (
        db.query(QuizSubmission)
        .filter(QuizSubmission.quiz_id == quiz_id)
        .all()
    )

    def get_student_name(user):
        if not user:
            return "Unknown Student"
        # Try different common fields
        if hasattr(user, "name") and user.name:
            return user.name
        if hasattr(user, "full_name") and user.full_name:
            return user.full_name
        if hasattr(user, "username") and user.username:
            return user.username
        if hasattr(user, "email"):
            return user.email.split("@")[0]
        return "Student"

    return [
        {
            "submission_id": s.id,
            "student_id": s.user_id,
            "student_name": get_student_name(s.user),
            "student_email": s.user.email if s.user else None,
            "score": s.score,
            "is_late": s.is_late,
            "submitted_at": s.submitted_at,
            "total_marks": s.quiz.total_marks if s.quiz else None,
            "tab_switches": s.tab_switches,
            "fullscreen_exits": s.fullscreen_exits,
            "auto_submitted": s.auto_submitted,
            "flagged_for_review": s.flagged_for_review,
        }
        for s in submissions
    ]


def grade_submission(db: Session, payload: GradeQuiz):
    submission = db.query(QuizSubmission).filter(
        QuizSubmission.id == payload.submission_id
    ).first()
    if not submission:
        return {"error": "Submission not found"}

    submission.score = payload.score
    submission.graded_at = datetime.now(timezone.utc)
    if payload.remarks is not None:
        submission.remarks = payload.remarks.strip() or None
    db.commit()

    return {"message": "Score updated"}


def get_student_quiz_result(db: Session, quiz_id: int, user_id: int):
    submission = db.query(QuizSubmission).filter(
        QuizSubmission.quiz_id == quiz_id,
        QuizSubmission.user_id == user_id
    ).first()

    if not submission:
        return {"submitted": False}

    return {
        "submitted": True,
        "score": submission.score,
        "total_marks": submission.quiz.total_marks,
        "is_late": submission.is_late,
        "submitted_at": submission.submitted_at,
        "flagged_for_review": submission.flagged_for_review,
        "remarks": submission.remarks,
        "solution_url": submission.quiz.solution_url,
    }


def get_submission_with_answers(db: Session, submission_id: int):
    submission = (
        db.query(QuizSubmission)
        .filter(QuizSubmission.id == submission_id)
        .first()
    )

    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    def _get_name(user):
        if not user:
            return "Unknown Student"
        if hasattr(user, "name") and user.name:
            return user.name
        if hasattr(user, "full_name") and user.full_name:
            return user.full_name
        if hasattr(user, "username") and user.username:
            return user.username
        if hasattr(user, "email"):
            return user.email.split("@")[0]
        return "Student"

    answers_data = []

    for ans in submission.answers:
        q = ans.question

        item = {
            "question_id": q.id,
            "question_text": q.question_text,
            "is_mcq": q.is_mcq,
            "marks": q.marks,
        }

        if q.is_mcq:
            if ans.selected_option_id:
                opt = db.query(QuizOption).get(ans.selected_option_id)
                item["selected_option"] = {
                    "id": opt.id,
                    "option_text": opt.option_text
                }
            else:
                item["selected_option"] = None
        else:
            item["uploaded_file_url"] = ans.uploaded_file_url
            item["original_filename"] = ans.original_filename

        answers_data.append(item)

    return {
        "submission_id": submission.id,
        "quiz_id": submission.quiz_id,
        "student_id": submission.user_id,
        "student_name": _get_name(submission.user),
        "student_email": submission.user.email if submission.user else None,
        "score": submission.score,
        "is_late": submission.is_late,
        "submitted_at": submission.submitted_at,
        "tab_switches": submission.tab_switches,
        "fullscreen_exits": submission.fullscreen_exits,
        "auto_submitted": submission.auto_submitted,
        "flagged_for_review": submission.flagged_for_review,
        "answers": answers_data,
    }
