from collections import defaultdict
from time import time

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from crud.notifications import notify_admins
from database import get_db
from schemas.contact import ContactMessage

router = APIRouter(prefix="/contact", tags=["Contact"])

MAX_MESSAGES_PER_WINDOW = 5
RATE_WINDOW_SECONDS = 60 * 60

# client address -> recent send times
recent_messages: dict[str, list[float]] = defaultdict(list)


def _client_address(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _enforce_rate_limit(address: str) -> None:
    cutoff = time() - RATE_WINDOW_SECONDS
    recent = [sent_at for sent_at in recent_messages[address] if sent_at > cutoff]
    if len(recent) >= MAX_MESSAGES_PER_WINDOW:
        recent_messages[address] = recent
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many messages. Please try again later.",
        )
    recent.append(time())
    recent_messages[address] = recent


@router.post("", status_code=status.HTTP_201_CREATED)
def send_contact_message(
    payload: ContactMessage,
    request: Request,
    db: Session = Depends(get_db),
):
    """Public contact form. Messages reach admins as portal notifications."""
    _enforce_rate_limit(_client_address(request))

    delivered = notify_admins(
        db,
        kind="contact",
        title=f"Contact form: {payload.name}"[:160],
        message=f"From {payload.name} <{payload.email}>\n\n{payload.message}",
    )
    if not delivered:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="We could not deliver your message. Please email us instead.",
        )
    return {"message": "Message sent"}
