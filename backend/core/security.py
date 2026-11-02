from datetime import datetime, timedelta, timezone
from jose import jwt
from passlib.context import CryptContext

from core.config_template import SECRET_KEY, ALGORITHM, REFRESH_TOKEN_EXPIRE_MINUTES

from fastapi import Depends, HTTPException, status, WebSocket
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session

from database import get_db
from models.users import User
from crud.users import get_user_by_username

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)


def _encode(data: dict, expires_delta: timedelta, token_type: str) -> str:
    now = datetime.now(timezone.utc)
    to_encode = data.copy()
    to_encode.update({"exp": now + expires_delta, "iat": int(now.timestamp()), "type": token_type})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_access_token(data: dict, expires_delta: timedelta):
    return _encode(data, expires_delta, "access")


def create_refresh_token(data: dict, expires_delta: timedelta | None = None):
    return _encode(data, expires_delta or timedelta(minutes=REFRESH_TOKEN_EXPIRE_MINUTES), "refresh")


def token_is_current(user: User, payload: dict) -> bool:
    """A password change or reset ends every session issued before it."""
    changed_at = user.password_changed_at
    if changed_at is None:
        return True
    if changed_at.tzinfo is None:
        changed_at = changed_at.replace(tzinfo=timezone.utc)
    issued_at = payload.get("iat")
    return isinstance(issued_at, (int, float)) and issued_at >= int(changed_at.timestamp())


def user_from_token(db: Session, token: str, token_type: str = "access") -> User | None:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None
    # Tokens issued before token types existed are access tokens.
    if payload.get("type", "access") != token_type:
        return None
    username = payload.get("sub")
    if not username:
        return None
    user = get_user_by_username(db, username)
    if user is None or not token_is_current(user, payload):
        return None
    return user


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    user = user_from_token(db, token)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Your session has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

def get_current_admin(current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return current_user

def get_current_admin_or_ta(current_user: User = Depends(get_current_user)):
    if not current_user.is_admin and not current_user.is_ta:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin or TA privileges required"
        )
    return current_user


async def get_current_user_ws(websocket: WebSocket, db: Session) -> User:
    token = websocket.query_params.get("token")
    user = user_from_token(db, token) if token else None
    if not user:
        await websocket.close(code=1008)
        raise HTTPException(status_code=401, detail="Invalid token")
    return user
