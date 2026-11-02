from sqlalchemy import func
from sqlalchemy.orm import Session
from models.users import User
from schemas.users import UserCreate
from core.hashing import get_password_hash


def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()


def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()


def find_user_by_username_ci(db: Session, username: str):
    return db.query(User).filter(func.lower(User.username) == username.strip().lower()).first()


def find_user_by_email_ci(db: Session, email: str):
    return db.query(User).filter(func.lower(User.email) == email.strip().lower()).first()


def find_user_for_login(db: Session, identifier: str):
    """Match a username or an email address. An exact username wins, so older
    accounts that differ only by case still reach the right person."""
    identifier = identifier.strip()
    if not identifier:
        return None
    exact = get_user_by_username(db, identifier)
    if exact:
        return exact
    if "@" in identifier:
        return find_user_by_email_ci(db, identifier)
    return find_user_by_username_ci(db, identifier)


def get_all_users(db: Session):
    return db.query(User).all()


def create_user(db: Session, user: UserCreate):
    db_user = User(
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        hashed_password=get_password_hash(user.password),
        phone_number=user.phone_number,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
