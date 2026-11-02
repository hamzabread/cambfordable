from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from models.homeworks import HomeworkSubmission, Homework
from routers.uploads import (
    DOCUMENT_EXTENSIONS,
    HOMEWORK_IMAGES_DIR,
    HOMEWORK_UPLOAD_DIR,
    IMAGE_EXTENSIONS,
    MB,
    SOLUTIONS_UPLOAD_DIR,
    save_file,
    validate_upload,
)
from database import get_db
from crud.homeworks import create_homework, get_course_homeworks, grade_homework_submission, get_user_homework_submissions, get_homework_submissions
from schemas.homeworks import HomeworkCreate, HomeworkGrade, HomeworkOut, HomeworkSubmissionDetail, HomeworkSubmissionOut
from core.security import get_current_admin, get_current_admin_or_ta, get_current_user
from models.users import User
from models.enrollments import Enrollment
from models.courses import Course
from crud.notifications import notify_course_students, notify_grade_update
from crud.deletion import delete_homework

router = APIRouter(prefix="/homeworks", tags=["Homeworks"])


def _require_course_access(db: Session, user: User, course_id: int, *, write: bool = False) -> None:
    if user.is_admin:
        return
    if write and not user.is_ta:
        raise HTTPException(status_code=403, detail="Only administrators and teaching assistants can create homework")

    query = db.query(Enrollment).filter(
        Enrollment.user_id == user.id,
        Enrollment.course_id == course_id,
    )
    if not user.is_ta:
        query = query.filter(Enrollment.paid.is_(True))
    if not query.first():
        raise HTTPException(status_code=403, detail="You do not have access to this course")


def _as_utc(value: datetime) -> datetime:
    return value if value.tzinfo else value.replace(tzinfo=timezone.utc)


def is_late_submission(submission: HomeworkSubmission, homework: Homework) -> bool:
    if not submission.submitted_at or not homework.due_date:
        return False
    return _as_utc(submission.submitted_at) > _as_utc(homework.due_date)


# Create homework (admin)
@router.post("/", response_model=HomeworkOut)
def admin_create_homework(
    homework_in: HomeworkCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _require_course_access(db, user, homework_in.course_id, write=True)
    if homework_in.due_date <= datetime.now(timezone.utc):
        raise HTTPException(status_code=422, detail="Due date must be in the future")
    course = db.query(Course).filter(Course.id == homework_in.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    homework = create_homework(db, homework_in)
    notify_course_students(
        db,
        course_id=homework.course_id,
        kind="homework",
        title="New assignment posted",
        message=f"{homework.title} was added to {course.name}.",
        href="/homework",
    )
    return homework

# List homework for a course
@router.get("/course/{course_id}", response_model=list[HomeworkOut])
def list_course_homework(
    course_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _require_course_access(db, user, course_id)
    homeworks = get_course_homeworks(db, course_id)
    if user.is_admin or user.is_ta:
        return homeworks

    # Students see a solution only once they have submitted.
    submitted = {
        row[0]
        for row in db.query(HomeworkSubmission.homework_id)
        .filter(HomeworkSubmission.user_id == user.id)
        .all()
    }
    return [
        HomeworkOut.model_validate(homework).model_copy(
            update={"solution_url": homework.solution_url if homework.id in submitted else None}
        )
        for homework in homeworks
    ]

# List current user's submissions
@router.get("/me", response_model=list[HomeworkSubmissionOut])
def my_submissions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_user_homework_submissions(db, current_user.id)


@router.get("/overview")
def homework_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = (
        db.query(Homework, Course, HomeworkSubmission)
        .join(Course, Course.id == Homework.course_id)
        .join(Enrollment, Enrollment.course_id == Homework.course_id)
        .outerjoin(
            HomeworkSubmission,
            (HomeworkSubmission.homework_id == Homework.id)
            & (HomeworkSubmission.user_id == current_user.id),
        )
        .filter(
            Enrollment.user_id == current_user.id,
            Enrollment.paid.is_(True),
        )
        .order_by(Homework.due_date.asc())
        .all()
    )
    now = datetime.now(timezone.utc)
    courses: dict[int, dict] = {}
    items = []
    for homework, course, submission in rows:
        courses[course.id] = {"id": course.id, "name": course.name, "code": course.code}
        if submission and submission.score is not None:
            status = "graded"
        elif submission:
            status = "submitted"
        elif _as_utc(homework.due_date) < now:
            status = "overdue"
        else:
            status = "assigned"
        items.append({
            "id": homework.id,
            "course_id": course.id,
            "course_name": course.name,
            "course_code": course.code,
            "title": homework.title,
            "description": homework.description,
            "image_url": homework.image_url,
            "solution_url": homework.solution_url if submission else None,
            "due_date": homework.due_date,
            "max_score": homework.max_score,
            "status": status,
            "is_late": bool(submission and is_late_submission(submission, homework)),
            "submission_id": submission.id if submission else None,
            "file_url": submission.file_url if submission else None,
            "submitted_at": submission.submitted_at if submission else None,
            "score": submission.score if submission else None,
            "remark": submission.remark if submission else None,
        })
    return {"courses": list(courses.values()), "items": items}


@router.get("/submissions/{submission_id}")
def get_homework_submission(
    submission_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """One submission with everything the grading page needs."""
    submission = db.query(HomeworkSubmission).filter(HomeworkSubmission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="This submission doesn't exist")
    if not (user.is_admin or user.is_ta):
        raise HTTPException(status_code=403, detail="Only teachers and teaching assistants can grade submissions")
    homework = submission.homework
    _require_course_access(db, user, homework.course_id, write=True)
    return {
        "id": submission.id,
        "homework_id": homework.id,
        "homework_title": homework.title,
        "course_title": homework.course.name if homework.course else "",
        "student_user_id": submission.user_id,
        "student_name": (submission.user.full_name or submission.user.username) if submission.user else "Unknown student",
        "student_username": submission.user.username if submission.user else "",
        "submitted_at": submission.submitted_at,
        "is_late": is_late_submission(submission, homework),
        "score": submission.score,
        "max_score": homework.max_score,
        "remark": submission.remark,
        "file_url": submission.file_url,
    }


@router.get("/{homework_id}")
def get_homework(
    homework_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    homework = db.query(Homework).filter(Homework.id == homework_id).first()
    if not homework:
        raise HTTPException(status_code=404, detail="This assignment doesn't exist")
    _require_course_access(db, user, homework.course_id)
    submission = db.query(HomeworkSubmission).filter(
        HomeworkSubmission.homework_id == homework_id,
        HomeworkSubmission.user_id == user.id,
    ).first()
    show_solution = user.is_admin or user.is_ta or submission is not None
    return {
        "id": homework.id,
        "course_id": homework.course_id,
        "title": homework.title,
        "description": homework.description,
        "due_date": homework.due_date,
        "max_score": homework.max_score,
        "image_url": homework.image_url,
        "solution_url": homework.solution_url if show_solution else None,
    }


# routers/homeworks.py
@router.get("/{homework_id}/submissions", response_model=list[HomeworkSubmissionDetail])
def list_homework_submissions(
    homework_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_admin_or_ta)
):
    homework = db.query(Homework).filter(Homework.id == homework_id).first()
    if not homework:
        raise HTTPException(status_code=404, detail="Homework not found")
    _require_course_access(db, user, homework.course_id, write=True)
    return [
        HomeworkSubmissionDetail(
            **HomeworkSubmissionOut.model_validate(submission).model_dump(),
            student_name=(submission.user.full_name or submission.user.username) if submission.user else "Unknown student",
            student_username=submission.user.username if submission.user else "",
            student_email=submission.user.email if submission.user else None,
            is_late=is_late_submission(submission, homework),
        )
        for submission in get_homework_submissions(db, homework_id)
    ]

@router.post("/grade", response_model=HomeworkSubmissionOut)
def grade_homework(
    payload: HomeworkGrade,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_admin_or_ta)
):
    existing = db.query(HomeworkSubmission).filter(
        HomeworkSubmission.id == payload.submission_id
    ).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Homework submission not found")
    if not user.is_admin:
        _require_course_access(db, user, existing.homework.course_id, write=True)
    if payload.score is not None and (
        payload.score < 0 or payload.score > existing.homework.max_score
    ):
        raise HTTPException(
            status_code=422,
            detail=f"Score must be between 0 and {existing.homework.max_score:g}",
        )
    old_score, old_remark = existing.score, existing.remark
    submission = grade_homework_submission(db, payload)
    notify_grade_update(
        db,
        user_id=submission.user_id,
        item_kind="Assignment",
        item_title=submission.homework.title,
        old_score=old_score,
        new_score=submission.score,
        old_remark=old_remark,
        new_remark=submission.remark,
    )
    return submission

@router.post("/{homework_id}/submit")
async def submit_homework_endpoint(
    homework_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    homework = db.query(Homework).filter(Homework.id == homework_id).first()
    if not homework:
        raise HTTPException(status_code=404, detail="Homework not found")
    _require_course_access(db, user, homework.course_id)

    existing = db.query(HomeworkSubmission).filter(
        HomeworkSubmission.homework_id == homework_id,
        HomeworkSubmission.user_id == user.id,
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="You have already submitted this assignment")

    validate_upload(file, DOCUMENT_EXTENSIONS, 10 * MB)
    file_path = save_file(file, HOMEWORK_UPLOAD_DIR)
    formatted_path = f"/{file_path}"

    submission = HomeworkSubmission(
        homework_id=homework_id,
        user_id=user.id,
        file_url=formatted_path,
        submitted_at=datetime.now(timezone.utc)
    )
    db.add(submission)
    db.commit()
    late = is_late_submission(submission, homework)
    return {
        "message": "Submitted late" if late else "Submitted successfully",
        "url": formatted_path,
        "is_late": late,
    }


# Upload image to homework question
@router.post("/{homework_id}/image")
async def upload_homework_image(
    homework_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_admin_or_ta)
):
    """Upload an image for a homework question"""
    homework = db.query(Homework).filter(Homework.id == homework_id).first()
    if not homework:
        raise HTTPException(status_code=404, detail="Homework not found")
    _require_course_access(db, user, homework.course_id, write=True)

    validate_upload(file, IMAGE_EXTENSIONS, 10 * MB)
    file_path = save_file(file, HOMEWORK_IMAGES_DIR)
    image_url = f"/{file_path}"

    # Update homework with image URL
    homework.image_url = image_url
    db.commit()

    return {
        "message": "Image uploaded successfully",
        "image_url": image_url,
        "homework_id": homework_id
    }


# ── Solution file management (Admin / TA) ──────────────────

@router.post("/{homework_id}/solution")
async def upload_homework_solution(
    homework_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_admin_or_ta),
):
    """Upload a solution file for a homework (visible to all students who submitted)"""
    homework = db.query(Homework).filter(Homework.id == homework_id).first()
    if not homework:
        raise HTTPException(status_code=404, detail="Homework not found")
    _require_course_access(db, user, homework.course_id, write=True)

    validate_upload(file, DOCUMENT_EXTENSIONS, 20 * MB)
    file_path = save_file(file, SOLUTIONS_UPLOAD_DIR)
    homework.solution_url = f"/{file_path}"
    db.commit()

    return {
        "message": "Solution uploaded successfully",
        "solution_url": homework.solution_url,
        "homework_id": homework_id,
    }


@router.delete("/{homework_id}/solution")
def remove_homework_solution(
    homework_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_admin_or_ta),
):
    """Remove a solution file from a homework"""
    homework = db.query(Homework).filter(Homework.id == homework_id).first()
    if not homework:
        raise HTTPException(status_code=404, detail="Homework not found")
    _require_course_access(db, user, homework.course_id, write=True)

    homework.solution_url = None
    db.commit()

    return {"message": "Solution removed", "homework_id": homework_id}


@router.get("/{homework_id}/solution")
def get_homework_solution(
    homework_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Get the solution URL for a homework.
    Only accessible by students who have submitted, or admin/TA.
    """
    homework = db.query(Homework).filter(Homework.id == homework_id).first()
    if not homework:
        raise HTTPException(status_code=404, detail="Homework not found")
    _require_course_access(db, user, homework.course_id)

    if not homework.solution_url:
        raise HTTPException(status_code=404, detail="No solution uploaded for this homework")

    # Admin / TA can always view
    if not (user.is_admin or getattr(user, "is_ta", False)):
        submission = db.query(HomeworkSubmission).filter(
            HomeworkSubmission.homework_id == homework_id,
            HomeworkSubmission.user_id == user.id,
        ).first()
        if not submission:
            raise HTTPException(
                status_code=403,
                detail="You must submit the homework before viewing the solution",
            )

    return {"solution_url": homework.solution_url, "homework_id": homework_id}


@router.delete("/{homework_id}", status_code=204)
def admin_delete_homework(
    homework_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Deletes the homework with every submission and grade."""
    homework = db.query(Homework).filter(Homework.id == homework_id).first()
    if not homework:
        raise HTTPException(status_code=404, detail="Homework not found")
    delete_homework(db, homework)
