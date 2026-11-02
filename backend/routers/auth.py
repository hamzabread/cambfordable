# routers/auth.py

import hashlib
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, BackgroundTasks, Body, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from database import get_db
from models.users import User as UserModel
from schemas.users import ForgotPasswordRequest, PasswordReset, UserCreate, UserMe
from schemas.auth import Token
from crud.users import create_user, find_user_by_email_ci, find_user_by_username_ci, find_user_for_login
from core.email import email_service
from core.email_config import email_settings
from core.hashing import get_password_hash, verify_password
from core.config_template import ACCESS_TOKEN_EXPIRE_MINUTES, SECRET_KEY, ALGORITHM
from core.rate_limit import SlidingWindowLimiter, client_address
from core.security import create_access_token, create_refresh_token, get_current_user, user_from_token

router = APIRouter(prefix="/auth", tags=["Auth"])

RESET_TOKEN_MINUTES = 30

# Ten wrong passwords for one account, or thirty from one address, within
# fifteen minutes lock further attempts for the rest of the window.
login_failures = SlidingWindowLimiter(
    limit=10,
    window_seconds=15 * 60,
    message="Too many failed login attempts. Please wait 15 minutes and try again.",
)
address_failures = SlidingWindowLimiter(
    limit=30,
    window_seconds=15 * 60,
    message="Too many failed login attempts. Please wait 15 minutes and try again.",
)
reset_requests = SlidingWindowLimiter(
    limit=5,
    window_seconds=60 * 60,
    message="Too many reset requests. Please try again later.",
)


def issue_tokens(user: UserModel) -> dict:
    return {
        "access_token": create_access_token(
            {"sub": user.username},
            timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        ),
        "refresh_token": create_refresh_token({"sub": user.username}),
        "token_type": "bearer",
    }


def _password_fingerprint(user: UserModel) -> str:
    # Ties a reset link to the current password, so it works only once.
    return hashlib.sha256(user.hashed_password.encode()).hexdigest()[:16]


# ------------------------
# Signup
# ------------------------
@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    # Usernames and emails are unique regardless of case, so "Admin" can't sit
    # next to "admin".
    if find_user_by_username_ci(db, user.username):
        raise HTTPException(status_code=400, detail="That username is already taken")
    if find_user_by_email_ci(db, user.email):
        raise HTTPException(status_code=400, detail="An account with that email already exists")

    create_user(db, user)
    return {"message": "User created successfully"}

# ------------------------
# Login
# ------------------------
@router.post("/login", response_model=Token)
def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    identifier = form_data.username.strip().lower()
    address = client_address(request)
    login_failures.check(identifier)
    address_failures.check(address)

    user = find_user_for_login(db, form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        login_failures.hit(identifier)
        address_failures.hit(address)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username, email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )

    login_failures.reset(identifier)
    return issue_tokens(user)

# ------------------------
# Current user
# ------------------------
@router.get("/me", response_model=UserMe)
def read_users_me(current_user: UserModel = Depends(get_current_user)):
    return current_user


# ------------------------
# Refresh token
# ------------------------
@router.post("/refresh", response_model=Token)
def refresh_token(refresh_token: str = Body(..., embed=True), db: Session = Depends(get_db)):
    user = user_from_token(db, refresh_token, token_type="refresh")
    if not user:
        raise HTTPException(status_code=401, detail="Your session has expired. Please log in again.")
    return issue_tokens(user)


# ------------------------
# Password reset
# ------------------------
@router.post("/forgot-password")
def forgot_password(
    payload: ForgotPasswordRequest,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    reset_requests.check(client_address(request))
    reset_requests.hit(client_address(request))

    if not email_service.is_configured:
        raise HTTPException(
            status_code=503,
            detail="Password reset by email isn't available yet. Use the contact page and an admin will help you.",
        )

    user = find_user_by_email_ci(db, payload.email)
    if user:
        token = jwt.encode(
            {
                "sub": user.username,
                "type": "reset",
                "pwd": _password_fingerprint(user),
                "exp": datetime.now(timezone.utc) + timedelta(minutes=RESET_TOKEN_MINUTES),
            },
            SECRET_KEY,
            algorithm=ALGORITHM,
        )
        reset_url = f"{email_settings.FRONTEND_URL.rstrip('/')}/reset-password?token={token}"
        background_tasks.add_task(
            email_service.send_password_reset_email,
            to_email=user.email,
            student_name=user.full_name or user.username,
            reset_url=reset_url,
        )
    # The same answer either way, so the form can't be used to find accounts.
    return {"message": "If that email has an account, a reset link is on its way."}


@router.post("/reset-password")
def reset_password(payload: PasswordReset, db: Session = Depends(get_db)):
    invalid = HTTPException(status_code=400, detail="This reset link is invalid or has expired. Request a new one.")
    try:
        claims = jwt.decode(payload.token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise invalid
    if claims.get("type") != "reset":
        raise invalid
    user = db.query(UserModel).filter(UserModel.username == claims.get("sub")).first()
    if not user or claims.get("pwd") != _password_fingerprint(user):
        raise invalid

    user.hashed_password = get_password_hash(payload.new_password)
    user.password_changed_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Your password has been changed. You can log in now."}
