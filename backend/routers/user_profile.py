from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session
from models.users import User
from schemas.users import PasswordChange, UserMe, UserProfileUpdate, normalize_phone
from schemas.whatsapp import UpdateUserPhoneRequest
from database import get_db
from core.security import get_current_user
from core.hashing import get_password_hash, verify_password

router = APIRouter(prefix="/users/profile", tags=["user-profile"])


@router.patch("", response_model=UserMe)
def update_profile(
    request: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update student-controlled profile fields."""
    updates = request.model_dump(exclude_unset=True)

    if "email" in updates and updates["email"] is None:
        raise HTTPException(status_code=422, detail="Email address can't be empty")
    requested_email = updates.get("email")
    if requested_email and requested_email != current_user.email:
        existing_user = (
            db.query(User)
            .filter(func.lower(User.email) == requested_email.lower(), User.id != current_user.id)
            .first()
        )
        if existing_user:
            raise HTTPException(status_code=409, detail="Email address is already in use")

    if "full_name" in updates and updates["full_name"] is None:
        raise HTTPException(status_code=422, detail="Full name can't be empty")

    for field, value in updates.items():
        setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/password")
def change_password(
    request: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(request.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if verify_password(request.new_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="New password must be different")

    current_user.hashed_password = get_password_hash(request.new_password)
    current_user.password_changed_at = datetime.now(timezone.utc)
    db.commit()
    # Older sessions stop working; this one carries on with fresh tokens.
    from routers.auth import issue_tokens
    return {"message": "Password updated successfully", **issue_tokens(current_user)}

@router.post("/phone-number")
def update_phone_number(
    request: UpdateUserPhoneRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update user's phone number for WhatsApp integration
    
    Format: +[country code][number]
    Example: +92333123456
    """
    try:
        phone_number = normalize_phone(request.phone_number)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))

    user = db.query(User).filter(User.id == current_user.id).first()
    user.phone_number = phone_number
    db.commit()
    db.refresh(user)
    
    return {
        "message": "Phone number updated successfully",
        "phone_number": user.phone_number
    }

@router.get("/phone-number")
def get_phone_number(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's phone number"""
    user = db.query(User).filter(User.id == current_user.id).first()
    
    return {
        "phone_number": user.phone_number,
        "has_phone": user.phone_number is not None
    }
