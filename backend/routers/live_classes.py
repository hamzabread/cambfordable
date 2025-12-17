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

router = APIRouter(prefix="/live-classes", tags=["Live Classes"])


@router.get("/{class_id}/join", response_model=LiveClassJoin)
def join_live_class(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    live_class = get_joinable_live_class(
        db,
        class_id=class_id,
        user=current_user,
    )

    return LiveClassJoin(
        zoom_url=live_class.meeting_url,  
        starts_at=live_class.starts_at,
    )

@router.post("/", response_model=LiveClassOut)
def admin_create_live_class(
    live_class_in: LiveClassCreate,
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin)
):
    return create_live_class(db, live_class_in)


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

