from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from crud.users import get_all_users
from database import get_db
from core.security import get_current_admin
from models.users import User
from sqlalchemy.orm import Session

router = APIRouter(prefix="/users", tags=["Users"])


class UpdateUserRoleSchema(BaseModel):
    is_admin: bool
    is_ta: bool


@router.get("/", status_code=status.HTTP_200_OK)
def list_users(db: Session = Depends(get_db)):
    users = get_all_users(db)
    return users


@router.patch("/{user_id}/role", status_code=status.HTTP_200_OK)
def update_user_role(
    user_id: int,
    role_data: UpdateUserRoleSchema,
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.is_admin = role_data.is_admin
    user.is_ta = role_data.is_ta
    db.commit()
    db.refresh(user)
    
    return {
        "message": "User role updated successfully",
        "user_id": user.id,
        "is_admin": user.is_admin,
        "is_ta": user.is_ta
    }

