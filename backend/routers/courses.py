from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session

from database import get_db
from core.security import get_current_user, get_current_admin
from models.courses import Course
from models.enrollments import Enrollment
from models.users import User
from crud.enrollments import (
    course_progress,
    create_enrollment,
    get_user_courses_with_progress,
)
from crud.enrollments import admin_enroll_user
from schemas.courses import CourseAdminOut, CourseCatalogItem, CourseCreate, CourseOut, CourseUpdate, EnrolledCourseBase
from crud.courses import get_all_courses, create_course
from crud.deletion import delete_course
from models.live_classes import LiveClass
from crud.notifications import notify_admins
from crud.billing import billing_state, format_day, is_staff, record_proof, as_utc, now_utc, RENEWAL_WINDOW
from routers.uploads import PAYMENT_UPLOAD_DIR, save_file, validate_upload, MB
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError


router = APIRouter(prefix="/courses", tags=["Courses"])

PAYMENT_PROOF_TYPES = {"application/pdf", "image/jpeg", "image/png", "image/webp"}
MAX_PAYMENT_PROOF_SIZE = 10 * 1024 * 1024


@router.get("/catalog", response_model=list[CourseCatalogItem])
def course_catalog(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the catalog with the current user's real enrollment state."""
    courses = db.query(Course).order_by(Course.name.asc()).all()
    enrollments = {
        enrollment.course_id: enrollment
        for enrollment in db.query(Enrollment)
        .filter(Enrollment.user_id == current_user.id)
        .all()
    }

    progress = course_progress(
        db,
        current_user.id,
        [course_id for course_id, enrollment in enrollments.items() if enrollment.paid],
    )

    catalog = []
    for course in courses:
        enrollment = enrollments.get(course.id)
        # Archived courses stay visible only to the people already in them.
        if course.archived_at and not enrollment:
            continue
        billing = billing_state(enrollment) if enrollment else {}
        if enrollment and enrollment.paid:
            status = "enrolled"
        elif enrollment and enrollment.paused_at:
            status = "paused"
        elif enrollment and not enrollment.proof_pending and enrollment.payment_rejection_reason:
            status = "rejected"
        elif enrollment:
            status = "pending"
        else:
            status = "available"
        percent, done = progress.get(course.id, (0, 0))
        catalog.append(
            CourseCatalogItem(
                id=course.id,
                name=course.name,
                code=course.code,
                enrollment_status=status,
                archived=bool(course.archived_at),
                progress=percent,
                completed=done,
                # A rejected renewal is shown on an enrolled or paused course too.
                rejection_reason=(
                    enrollment.payment_rejection_reason
                    if enrollment and not enrollment.proof_pending
                    else None
                ),
                paid_until=billing.get("paid_until"),
                overdue=billing.get("overdue", False),
                pauses_on=billing.get("pauses_on"),
                removal_on=billing.get("removal_on"),
                renewal_open=billing.get("renewal_open", False),
                proof_pending=billing.get("proof_pending", False),
            )
        )
    return catalog


@router.post("/{course_id}/enroll")
def enroll_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if course.archived_at:
        raise HTTPException(status_code=409, detail="This course is closed to new students")
    enrollment = create_enrollment(db, current_user, course_id)
    if not enrollment:
        raise HTTPException(status_code=404, detail="Course not found")

    return {"message": "Enrollment request created; pending approval"}


@router.post("/{course_id}/enroll-with-proof")
async def enroll_course_with_proof(
    course_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if course.archived_at:
        raise HTTPException(status_code=409, detail="This course is closed and isn't taking payments")

    existing = db.query(Enrollment).filter(
        Enrollment.user_id == current_user.id,
        Enrollment.course_id == course_id,
    ).first()
    if existing and existing.proof_pending:
        raise HTTPException(status_code=409, detail="Your payment proof is already pending review")
    if existing and existing.paid:
        if is_staff(current_user):
            raise HTTPException(status_code=409, detail="You already have access to this course")
        paid_until = as_utc(existing.paid_until)
        if paid_until and paid_until - now_utc() > RENEWAL_WINDOW:
            raise HTTPException(
                status_code=409,
                detail=f"Your access is paid until {format_day(paid_until)}. "
                f"You can upload the next payment from {format_day(paid_until - RENEWAL_WINDOW)}.",
            )
    renewal = bool(existing and (existing.paid or existing.paused_at))

    if file.content_type not in PAYMENT_PROOF_TYPES:
        raise HTTPException(status_code=400, detail="Upload a PDF, JPEG, PNG, or WebP file")
    validate_upload(file, {"pdf", "jpg", "jpeg", "png", "webp"}, MAX_PAYMENT_PROOF_SIZE)

    # Save payment proof file
    file_path = save_file(file, PAYMENT_UPLOAD_DIR)
    formatted_path = f"/{file_path}"

    enrollment = existing or create_enrollment(db, current_user, course_id)
    if not enrollment:
        raise HTTPException(status_code=404, detail="Course not found")
    # Every proof is kept as a payment record (crud/billing.py).
    record_proof(db, enrollment, formatted_path, file.filename)

    # Surface the pending approval to admins instead of relying on them
    # noticing it in the admin panel.
    notify_admins(
        db,
        kind="enrollment",
        title="Renewal proof to review" if renewal else "Payment proof to review",
        message=f"{current_user.full_name or current_user.username} submitted "
        f"{'a monthly renewal' if renewal else 'payment proof'} for {course.name}.",
        href="/dashboard",
    )

    return {
        "message": "Renewal proof submitted; pending admin approval" if renewal else "Payment proof submitted; pending admin approval",
        "payment_proof_url": formatted_path,
        "payment_proof_name": file.filename,
    }


@router.get("/me", response_model=list[EnrolledCourseBase])
def my_courses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_user_courses_with_progress(db, current_user)



@router.get("/", response_model=list[CourseOut])
def list_courses(db: Session = Depends(get_db)):
    """Open courses, for the forms that schedule classes and set work."""
    return db.query(Course).filter(Course.archived_at.is_(None)).order_by(Course.name.asc()).all()


@router.get("/admin", response_model=list[CourseAdminOut])
def admin_list_courses(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    courses = db.query(Course).order_by(Course.archived_at.isnot(None), Course.name.asc()).all()
    students = dict(
        db.query(Enrollment.course_id, func.count(Enrollment.id))
        .join(User, User.id == Enrollment.user_id)
        .filter(User.is_admin.isnot(True), User.is_ta.isnot(True))
        .group_by(Enrollment.course_id)
        .all()
    )
    classes = dict(db.query(LiveClass.course_id, func.count(LiveClass.id)).group_by(LiveClass.course_id).all())
    result = []
    for course in courses:
        out = CourseAdminOut.model_validate(course)
        out.student_count = students.get(course.id, 0)
        out.class_count = classes.get(course.id, 0)
        result.append(out)
    return result


def _reject_duplicate_code(db: Session, code: str, course_id: int | None = None) -> None:
    query = db.query(Course).filter(func.lower(Course.code) == code.lower())
    if course_id is not None:
        query = query.filter(Course.id != course_id)
    if query.first():
        raise HTTPException(status_code=409, detail=f"A course with the code {code} already exists")


@router.post("/", response_model=CourseOut)
def admin_create_course(
    course_in: CourseCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin)
):
    _reject_duplicate_code(db, course_in.code)
    try:
        course = create_course(db, course_in)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail=f"A course with the code {course_in.code} already exists")

    # Auto-enroll the admin in the course (mark as paid)
    admin_enroll_user(db, user_id=admin_user.id, course_id=course.id, paid=True)
    
    return course


@router.patch("/{course_id}", response_model=CourseAdminOut)
def admin_update_course(
    course_id: int,
    course_in: CourseUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    updates = course_in.model_dump(exclude_unset=True)
    if "name" in updates and not updates["name"]:
        raise HTTPException(status_code=422, detail="Course name can't be empty")
    for field, value in updates.items():
        setattr(course, field, value)
    db.commit()
    db.refresh(course)
    return course


def _admin_course(db: Session, course_id: int) -> Course:
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


@router.post("/{course_id}/archive", response_model=CourseAdminOut)
def admin_archive_course(
    course_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    """Close a finished course: no new students, no monthly billing, no new
    classes. Enrolled students keep their classes, recordings and results."""
    course = _admin_course(db, course_id)
    if not course.archived_at:
        course.archived_at = now_utc()
        db.commit()
        db.refresh(course)
    return course


@router.post("/{course_id}/unarchive", response_model=CourseAdminOut)
def admin_unarchive_course(
    course_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    course = _admin_course(db, course_id)
    course.archived_at = None
    db.commit()
    db.refresh(course)
    return course


@router.delete("/{course_id}")
def admin_delete_course(
    course_id: int,
    confirm: str = Query(..., description="The course code, typed by the admin"),
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    """Permanently delete the course with its classes, quizzes, homework,
    questions, enrollments and payment records."""
    course = _admin_course(db, course_id)
    if confirm.strip().lower() != course.code.lower():
        raise HTTPException(status_code=422, detail=f"Type the course code ({course.code}) to confirm")
    counts = delete_course(db, course)
    return {"deleted": course_id, **counts}
