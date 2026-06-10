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
)
from core.security import get_current_admin, get_current_admin_or_teacher
from models.live_classes import LiveClass
from models.live_class_sessions import LiveClassSession
from core.zoom_sdk import generate_zoom_sdk_signature
from core.zoom_config import zoom_settings
from routers.uploads import LIVE_CLASSES_UPLOAD_DIR, save_file

router = APIRouter(prefix="/live-classes", tags=["Live Classes"])

SESSION_TTL_SECONDS = 75


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

    # 1. Determine the role: admins and teachers join as host (1), students as attendee (0)
    user_role = 1 if (current_user.is_admin or current_user.is_teacher) else 0

    # 2. Pass user_role instead of 0
    signature = generate_zoom_sdk_signature(
        meeting_number=str(live_class.meeting_id),
        role=user_role, # <--- Fix is here
    )

    return LiveClassJoin(
        meeting_id=str(live_class.meeting_id),
        signature=signature,
        sdk_key=zoom_settings.ZOOM_CLIENT_ID,
        user_name=current_user.full_name,
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
    current_user: User = Depends(get_current_admin_or_teacher),
):
    """
    Admin or teacher creates a live class:
    - Zoom meeting is created dynamically
    - meeting_id is saved in DB
    """
    result = await create_live_class(
        db=db,
        title=live_class_in.title,
        course_id=live_class_in.course_id,
        starts_at=live_class_in.starts_at,
        duration=live_class_in.duration
    )
    return result


@router.get("/me", response_model=list[LiveClassOut])
def my_live_classes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_user_live_classes(db, current_user)


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
    
    # Save the file
    file_path = save_file(file, LIVE_CLASSES_UPLOAD_DIR)
    db_path = f"/{file_path}"
    
    # Update the class with the attachment URL
    live_class.attachment_url = db_path
    db.commit()
    db.refresh(live_class)
    
    return {"attachment_url": db_path, "original_filename": file.filename}

