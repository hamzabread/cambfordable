from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from crud.users import get_all_users
from crud.deletion import delete_user
from database import get_db
from core.security import get_current_admin
from models.users import User
from models.enrollments import Enrollment
from schemas.users import AcademicProfileUpdate, UserMe
from sqlalchemy.orm import Session

router = APIRouter(prefix="/users", tags=["Users"])


class UpdateUserRoleSchema(BaseModel):
    is_admin: bool
    is_ta: bool


class UpdateUserPaymentSchema(BaseModel):
    payment: bool


@router.get("/", response_model=list[UserMe], status_code=status.HTTP_200_OK)
def list_users(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    users = get_all_users(db)
    return users


@router.get("/{user_id}/courses")
def list_user_courses(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """Courses a user is attached to, for the Access Roles screen."""
    enrollments = db.query(Enrollment).filter(Enrollment.user_id == user_id).all()
    return [
        {
            "course_id": enrollment.course_id,
            "name": enrollment.course.name if enrollment.course else "",
            "code": enrollment.course.code if enrollment.course else "",
            "paid": enrollment.paid,
        }
        for enrollment in enrollments
    ]


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


@router.patch("/{user_id}/payment", status_code=status.HTTP_200_OK)
def update_user_payment(
    user_id: int,
    payload: UpdateUserPaymentSchema,
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    user.payment = payload.payment
    db.commit()
    db.refresh(user)

    return {
        "message": "Payment status updated successfully",
        "user_id": user.id,
        "payment": user.payment,
    }


@router.patch("/{user_id}/academic-profile", response_model=UserMe)
def update_academic_profile(
    user_id: int,
    payload: AcademicProfileUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    updates = payload.model_dump(exclude_unset=True)
    student_id = updates.get("student_id")
    if student_id:
        duplicate = db.query(User).filter(
            User.student_id == student_id,
            User.id != user_id,
        ).first()
        if duplicate:
            raise HTTPException(status_code=409, detail="Student ID is already in use")

    for field, value in updates.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_user(
    user_id: int,
    confirm: str = Query(..., description="The username, typed by the admin"),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """Permanently delete an account with its submissions, grades, messages,
    enrollments and payment records."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.id == current_admin.id:
        raise HTTPException(status_code=409, detail="You can't delete your own account")
    if user.is_admin:
        raise HTTPException(status_code=409, detail="Remove this person's admin role before deleting the account")
    if confirm.strip().lower() != user.username.lower():
        raise HTTPException(status_code=422, detail=f"Type the username ({user.username}) to confirm")
    delete_user(db, user)
