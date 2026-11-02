from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from core.security import get_current_user
from database import get_db
from models.courses import Course
from models.enrollments import Enrollment
from models.homeworks import Homework, HomeworkSubmission
from models.quiz import Quiz
from models.quiz_submission import QuizSubmission
from models.users import User


router = APIRouter(prefix="/results", tags=["Results"])


def _letter_grade(percentage: float | None) -> str:
    if percentage is None:
        return "—"
    if percentage >= 90:
        return "A"
    if percentage >= 80:
        return "B"
    if percentage >= 70:
        return "C"
    if percentage >= 60:
        return "D"
    return "F"


@router.get("/me")
def my_results(
    course_id: int | None = Query(None),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    course_query = (
        db.query(Course)
        .join(Enrollment, Enrollment.course_id == Course.id)
        .filter(Enrollment.user_id == user.id, Enrollment.paid.is_(True))
    )
    courses = course_query.order_by(Course.name.asc()).all()
    selected_courses = [course for course in courses if course_id is None or course.id == course_id]
    course_map = {course.id: course for course in selected_courses}
    course_ids = list(course_map)

    items: list[dict] = []
    if course_ids:
        quiz_rows = (
            db.query(QuizSubmission, Quiz)
            .join(Quiz, Quiz.id == QuizSubmission.quiz_id)
            .filter(
                QuizSubmission.user_id == user.id,
                QuizSubmission.score.isnot(None),
                Quiz.course_id.in_(course_ids),
            )
            .all()
        )
        for submission, quiz in quiz_rows:
            percentage = round((submission.score / quiz.total_marks) * 100, 1) if quiz.total_marks else 0
            course = course_map[quiz.course_id]
            items.append({
                "id": f"quiz-{submission.id}",
                "type": "quiz",
                "title": quiz.title,
                "course_id": course.id,
                "course_name": course.name,
                "course_code": course.code,
                "score": submission.score,
                "total_marks": quiz.total_marks,
                "percentage": percentage,
                "graded_at": submission.graded_at or submission.submitted_at,
                "feedback": submission.remarks,
                "href": f"/quiz/{quiz.id}/grades",
            })

        homework_rows = (
            db.query(HomeworkSubmission, Homework)
            .join(Homework, Homework.id == HomeworkSubmission.homework_id)
            .filter(
                HomeworkSubmission.user_id == user.id,
                HomeworkSubmission.score.isnot(None),
                Homework.course_id.in_(course_ids),
            )
            .all()
        )
        for submission, homework in homework_rows:
            percentage = round((submission.score / homework.max_score) * 100, 1) if homework.max_score else 0
            course = course_map[homework.course_id]
            items.append({
                "id": f"homework-{submission.id}",
                "type": "assignment",
                "title": homework.title,
                "course_id": course.id,
                "course_name": course.name,
                "course_code": course.code,
                "score": submission.score,
                "total_marks": homework.max_score,
                "percentage": percentage,
                "graded_at": submission.graded_at or submission.submitted_at,
                "feedback": submission.remark,
                "href": "/homework?tab=graded",
            })

    items.sort(key=lambda item: item["graded_at"], reverse=True)
    percentages = [item["percentage"] for item in items]
    average = round(sum(percentages) / len(percentages), 1) if percentages else None
    return {
        "courses": [
            {"id": course.id, "name": course.name, "code": course.code}
            for course in courses
        ],
        "summary": {
            "average_percentage": average,
            "letter_grade": _letter_grade(average),
            "graded_items": len(items),
            "courses_with_results": len({item["course_id"] for item in items}),
            "academic_standing": user.academic_standing or "Not provided",
        },
        "items": items,
        "trend": [
            {"label": item["title"], "percentage": item["percentage"]}
            for item in reversed(items[:8])
        ],
    }
