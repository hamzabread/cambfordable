from sqlalchemy.orm import Session
from models.quiz import Quiz
from models.quiz_question import QuizQuestion
from models.quiz_option import QuizOption
from schemas.quizzes import QuizCreate
from fastapi import HTTPException
from datetime import datetime, timezone

def create_quiz(db: Session, quiz_in: QuizCreate):
    quiz = Quiz(
        course_id=quiz_in.course_id,
        title=quiz_in.title,
        total_marks=quiz_in.total_marks,
        deadline=quiz_in.deadline,
        allow_late=quiz_in.allow_late
    )
    db.add(quiz)
    db.commit()
    db.refresh(quiz)

    for q in quiz_in.questions:
        question = QuizQuestion(
            quiz_id=quiz.id,
            question_text=q.question_text,
            is_mcq=q.is_mcq,
            marks=q.marks,
        )
        db.add(question)
        db.commit()
        db.refresh(question)

        if q.is_mcq and q.options:
            for opt in q.options:
                option = QuizOption(
                    question_id=question.id,
                    option_text=opt.option_text,
                    is_correct=opt.is_correct,
                )
                db.add(option)

    db.commit()
    return {"quiz_id": quiz.id, "message": "Quiz created"}


# ✅ THIS IS THE MISSING FUNCTION YOU NEED
def list_course_quizzes(db: Session, course_id: int):
    quizzes = db.query(Quiz).filter(Quiz.course_id == course_id).all()
    result = []
    for q in quizzes:
        result.append({
            "id": q.id,
            "title": q.title,
            "total_marks": q.total_marks,
            "course_id": q.course_id,
            "deadline": q.deadline,
            "allow_late": q.allow_late,
            "is_published": q.is_published,  # dynamic now
        })
    return result


def get_quiz_for_student(db: Session, quiz_id: int):
    # 1️⃣ Fetch quiz
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    # 2️⃣ Dynamically check if the quiz should be published
    now = datetime.now(timezone.utc)
    is_published = quiz.is_published
    if quiz.deadline and now > quiz.deadline:
        is_published = False

    if not is_published:
        raise HTTPException(status_code=403, detail="Quiz not published yet or deadline has passed")

    # 3️⃣ Prepare questions for student (hide correct options)
    questions = []
    for q in quiz.questions:
        q_data = {
            "id": q.id,
            "question_text": q.question_text,
            "is_mcq": q.is_mcq,
            "marks": q.marks,
        }

        if q.is_mcq:
            options = [{"id": opt.id, "option_text": opt.option_text} for opt in q.options]
            q_data["options"] = options

        questions.append(q_data)

    # 4️⃣ Return formatted quiz
    return {
        "id": quiz.id,
        "course_id": quiz.course_id,
        "title": quiz.title,
        "total_marks": quiz.total_marks,
        "deadline": quiz.deadline,
        "is_published": is_published,
        "allow_late": quiz.allow_late,
        "questions": questions
    }