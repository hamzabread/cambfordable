from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
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
from routers.uploads import LIVE_CLASSES_UPLOAD_DIR, save_file

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
        user_name=current_user.full_name,
        starts_at=live_class.starts_at,
        password=live_class.meeting_password,
        role=user_role,
    )


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

