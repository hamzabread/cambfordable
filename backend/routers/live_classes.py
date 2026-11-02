from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
from database import get_db
from core.security import get_current_user
from models.users import User
from crud.live_classes import get_joinable_live_class, create_live_class, get_user_live_classes
from schemas.live_classes import (
    LiveClassJoin,
    LiveClassCreate,
    LiveClassOut,
    LiveClassSessionClaim,
    LiveClassSessionStatus,
    AttendanceRow,
    ClassAttendanceOut,
)
from core.security import get_current_admin
from models.live_classes import LiveClass
from models.live_class_sessions import LiveClassSession
from core.zoom_sdk import generate_zoom_sdk_signature
from core.zoom_config import zoom_settings
from routers.uploads import ATTACHMENT_EXTENSIONS, LIVE_CLASSES_UPLOAD_DIR, MB, save_file, validate_upload
from crud.notifications import notify_course_students
from models.courses import Course
from models.enrollments import Enrollment
from models.class_attendance import ClassAttendance
from crud.billing import as_utc
from crud.deletion import delete_live_class
from crud.zoom_sync import attendance_minutes_for, attendance_status, class_length_minutes, sync_class

router = APIRouter(prefix="/live-classes", tags=["Live Classes"])

SESSION_TTL_SECONDS = 75

# Classes whose Zoom meeting is being created right now (double-click guard).
classes_being_created: set[tuple] = set()


def _prune_stale_sessions(db: Session, user_id: int) -> None:
    cutoff = datetime.now(timezone.utc) - timedelta(seconds=SESSION_TTL_SECONDS)
    db.query(LiveClassSession).filter(
        LiveClassSession.user_id == user_id,
        LiveClassSession.is_active.is_(True),
        LiveClassSession.last_seen < cutoff,
    ).update({"is_active": False}, synchronize_session=False)
    db.commit()


@router.get("/{class_id}/zoom-sdk", response_model=LiveClassJoin)
def get_zoom_sdk(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    live_class = get_joinable_live_class(
        db,
        class_id=class_id,
        user=current_user,
    )

    # 1. Determine the role based on admin status
    user_role = 1 if current_user.is_admin else 0

    # 2. Pass user_role instead of 0
    signature = generate_zoom_sdk_signature(
        meeting_number=str(live_class.meeting_id),
        role=user_role, # <--- Fix is here
    )

    return LiveClassJoin(
        meeting_id=str(live_class.meeting_id),
        signature=signature,
        sdk_key=zoom_settings.ZOOM_CLIENT_ID,
        user_name=current_user.full_name or current_user.username,
        starts_at=live_class.starts_at,
        password=live_class.meeting_password,
        role=user_role,
    )


@router.post("/{class_id}/session/claim", response_model=LiveClassSessionStatus)
def claim_live_class_session(
    class_id: int,
    payload: LiveClassSessionClaim,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_joinable_live_class(db, class_id=class_id, user=current_user)
    device_id = payload.device_id.strip()
    if not device_id:
        raise HTTPException(status_code=400, detail="Missing device_id")

    _prune_stale_sessions(db, current_user.id)

    existing = db.query(LiveClassSession).filter(
        LiveClassSession.user_id == current_user.id,
        LiveClassSession.is_active.is_(True),
    ).first()

    if existing and existing.device_id != device_id:
        raise HTTPException(
            status_code=409,
            detail="This account is already active on another device.",
        )

    now = datetime.now(timezone.utc)
    if existing:
        existing.live_class_id = class_id
        existing.device_id = device_id
        existing.last_seen = now
        db.commit()
        return LiveClassSessionStatus(active=True, detail="Session refreshed")

    session = LiveClassSession(
        user_id=current_user.id,
        live_class_id=class_id,
        device_id=device_id,
        started_at=now,
        last_seen=now,
        is_active=True,
    )
    db.add(session)
    db.commit()
    return LiveClassSessionStatus(active=True, detail="Session claimed")


@router.post("/{class_id}/session/heartbeat", response_model=LiveClassSessionStatus)
def heartbeat_live_class_session(
    class_id: int,
    payload: LiveClassSessionClaim,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    device_id = payload.device_id.strip()
    if not device_id:
        raise HTTPException(status_code=400, detail="Missing device_id")

    session = db.query(LiveClassSession).filter(
        LiveClassSession.user_id == current_user.id,
        LiveClassSession.device_id == device_id,
        LiveClassSession.is_active.is_(True),
    ).first()

    if not session:
        raise HTTPException(status_code=409, detail="Session is no longer active")

    session.live_class_id = class_id
    session.last_seen = datetime.now(timezone.utc)
    db.commit()
    return LiveClassSessionStatus(active=True, detail="Heartbeat ok")


@router.delete("/{class_id}/session/release", response_model=LiveClassSessionStatus)
def release_live_class_session(
    class_id: int,
    payload: LiveClassSessionClaim,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    device_id = payload.device_id.strip()
    if not device_id:
        raise HTTPException(status_code=400, detail="Missing device_id")

    session = db.query(LiveClassSession).filter(
        LiveClassSession.user_id == current_user.id,
        LiveClassSession.device_id == device_id,
        LiveClassSession.is_active.is_(True),
    ).first()

    if session:
        session.is_active = False
        session.last_seen = datetime.now(timezone.utc)
        db.commit()

    return LiveClassSessionStatus(active=False, detail="Session released")


@router.post("/", response_model=LiveClassOut)
async def admin_create_live_class(
    live_class_in: LiveClassCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """
    Admin creates a live class:
    - Zoom meeting is created dynamically
    - meeting_id is saved in DB
    """
    course = db.query(Course).filter(Course.id == live_class_in.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if course.archived_at:
        raise HTTPException(status_code=409, detail="This course is archived. Restore it before scheduling classes.")
    if live_class_in.starts_at.tzinfo is None:
        raise HTTPException(status_code=422, detail="Class start time must include a timezone")
    if live_class_in.starts_at <= datetime.now(timezone.utc):
        raise HTTPException(status_code=422, detail="Class start time must be in the future")
    # A double click sends the same class twice; the second would create
    # another Zoom meeting and notify everyone again.
    duplicate = db.query(LiveClass).filter(
        LiveClass.course_id == live_class_in.course_id,
        LiveClass.title == live_class_in.title,
        LiveClass.starts_at == live_class_in.starts_at,
    ).first()
    key = (live_class_in.course_id, live_class_in.title, live_class_in.starts_at)
    if duplicate or key in classes_being_created:
        raise HTTPException(status_code=409, detail="This class is already scheduled")
    classes_being_created.add(key)
    try:
        result = await create_live_class(
            db=db,
            title=live_class_in.title,
            course_id=live_class_in.course_id,
            starts_at=live_class_in.starts_at,
            duration=live_class_in.duration
        )
    finally:
        classes_being_created.discard(key)
    notify_course_students(
        db,
        course_id=live_class_in.course_id,
        kind="schedule",
        title="Class scheduled",
        message=f"{live_class_in.title} was scheduled for {course.name if course else 'your course'}.",
        href="/schedule",
    )
    return result


@router.get("/me", response_model=list[LiveClassOut])
def my_live_classes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    classes = get_user_live_classes(db, current_user)
    staff = current_user.is_admin or current_user.is_ta
    minutes = {} if staff else attendance_minutes_for(
        db, current_user.id, [c.id for c in classes if c.attendance_synced_at]
    )
    result = []
    for live_class in classes:
        out = LiveClassOut.model_validate(live_class)
        if not current_user.is_admin:
            out.start_url = None
        if not staff and live_class.attendance_synced_at:
            out.my_attendance_minutes = minutes.get(live_class.id, 0)
            out.attendance_status = attendance_status(out.my_attendance_minutes, class_length_minutes(live_class))
        result.append(out)
    return result


def _staff_class(db: Session, class_id: int, user: User) -> LiveClass:
    """The class, if the user is an admin or a TA on its course."""
    live_class = db.query(LiveClass).filter(LiveClass.id == class_id).first()
    if not live_class:
        raise HTTPException(status_code=404, detail="Class not found")
    if user.is_admin:
        return live_class
    if user.is_ta and db.query(Enrollment).filter(
        Enrollment.user_id == user.id, Enrollment.course_id == live_class.course_id
    ).first():
        return live_class
    raise HTTPException(status_code=403, detail="Only the course's teachers can see attendance")


@router.get("/{class_id}/attendance", response_model=ClassAttendanceOut)
def class_attendance(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Every student on the course with their minutes in class, plus Zoom guests
    that couldn't be matched to an account."""
    live_class = _staff_class(db, class_id, current_user)
    class_minutes = class_length_minutes(live_class)
    rows = db.query(ClassAttendance).filter(ClassAttendance.live_class_id == live_class.id).all()
    by_user = {row.user_id: row for row in rows if row.user_id}
    students = (
        db.query(User)
        .join(Enrollment, Enrollment.user_id == User.id)
        .filter(
            Enrollment.course_id == live_class.course_id,
            User.is_admin.isnot(True),
            User.is_ta.isnot(True),
        )
        .order_by(User.full_name, User.username)
        .all()
    )

    def row_for(user: User | None, row: ClassAttendance | None) -> AttendanceRow:
        minutes = row.minutes if row else 0
        return AttendanceRow(
            user_id=user.id if user else None,
            name=(user.full_name or user.username) if user else row.display_name,
            username=user.username if user else None,
            minutes=minutes,
            status=attendance_status(minutes, class_minutes),
            first_join=row.first_join if row else None,
            last_leave=row.last_leave if row else None,
        )

    return ClassAttendanceOut(
        class_id=live_class.id,
        class_minutes=class_minutes,
        source=rows[0].source if rows else None,
        synced_at=live_class.attendance_synced_at,
        students=[row_for(student, by_user.get(student.id)) for student in students],
        unmatched=[row_for(None, row) for row in rows if not row.user_id],
    )


@router.post("/{class_id}/zoom-sync")
def refresh_from_zoom(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetch the recording and attendance now instead of waiting for the hourly job."""
    live_class = _staff_class(db, class_id, current_user)
    if datetime.now(timezone.utc) < as_utc(live_class.ends_at):
        raise HTTPException(status_code=409, detail="Attendance and recordings are available after the class ends")
    result = sync_class(db, live_class, force=True)
    db.refresh(live_class)
    return {
        **result,
        "recording_url": live_class.recording_url,
        "recording_passcode": live_class.recording_passcode,
    }


@router.delete("/{class_id}", status_code=204)
def admin_delete_live_class(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """Deletes the class, its chat and attendance, and cancels the Zoom meeting."""
    live_class = db.query(LiveClass).filter(LiveClass.id == class_id).first()
    if not live_class:
        raise HTTPException(status_code=404, detail="Class not found")
    delete_live_class(db, live_class)


@router.get("/", response_model=list[LiveClassOut])
def list_live_classes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    return db.query(LiveClass).all()


@router.post("/{class_id}/attachment")
def upload_class_attachment(
    class_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """Admin uploads an attachment to a past class"""
    # Verify the class exists
    live_class = db.query(LiveClass).filter(LiveClass.id == class_id).first()
    if not live_class:
        raise HTTPException(status_code=404, detail="Class not found")
    
    validate_upload(file, ATTACHMENT_EXTENSIONS, 25 * MB)
    file_path = save_file(file, LIVE_CLASSES_UPLOAD_DIR)
    db_path = f"/{file_path}"
    
    # Update the class with the attachment URL
    live_class.attachment_url = db_path
    db.commit()
    db.refresh(live_class)
    
    return {"attachment_url": db_path, "original_filename": file.filename}

