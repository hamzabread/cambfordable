from fastapi import APIRouter, Depends, HTTPException, status
from crud.users import get_all_users
from database import get_db
from sqlalchemy.orm import Session

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/", status_code=status.HTTP_200_OK)
def list_users(db: Session = Depends(get_db)):
    users = get_all_users(db)
    return users

