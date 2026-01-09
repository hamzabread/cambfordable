from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from database import get_db
from core.security import get_current_user
from models.users import User
from crud.live_classes import get_joinable_live_class, create_live_class, get_user_live_classes
from schemas.live_classes import LiveClassJoin, LiveClassCreate, LiveClassOut
from core.security import get_current_admin
from models.live_classes import LiveClass
from core.zoom_sdk import generate_zoom_sdk_signature
from core.zoom_config import zoom_settings
from core.zoom_api import create_zoom_meeting


router = APIRouter(prefix="/live-classes", tags=["Live Classes"])


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

    signature = generate_zoom_sdk_signature(
        meeting_number=str(live_class.meeting_id),
        role=0,
    )

    return LiveClassJoin(
        meeting_id=str(live_class.meeting_id),
        signature=signature,
        sdk_key=zoom_settings.ZOOM_CLIENT_ID,
        user_name=current_user.full_name,
        starts_at=live_class.starts_at,
    )


@router.post("/", response_model=LiveClassOut)
async def admin_create_live_class(
    live_class_in: LiveClassCreate,
    db: Session = Depends(get_db)
):
    """
    Admin creates a live class:
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

