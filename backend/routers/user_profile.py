from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models.users import User
from schemas.whatsapp import UpdateUserPhoneRequest
from database import get_db
from core.security import get_current_user

router = APIRouter(prefix="/users/profile", tags=["user-profile"])

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
    # Validate phone number format (basic check)
    if not request.phone_number.startswith("+"):
        raise HTTPException(status_code=400, detail="Phone number must start with +")
    
    if len(request.phone_number) < 10:
        raise HTTPException(status_code=400, detail="Invalid phone number format")
    
    user = db.query(User).filter(User.id == current_user.id).first()
    user.phone_number = request.phone_number
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
