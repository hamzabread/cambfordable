from sqlalchemy.orm import Session
from models.live_class_messages import LiveClassMessage

def create_live_chat_message(
    db: Session,
    *,
    live_class_id: int,
    user_id: int,
    message: str
):
    msg = LiveClassMessage(
        live_class_id=live_class_id,
        user_id=user_id,
        message=message
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


# crud/live_chat.py
def get_live_chat_messages(
    db: Session,
    live_class_id: int,
    limit: int = 50
):
    return (
        db.query(LiveClassMessage)
        .filter(LiveClassMessage.live_class_id == live_class_id)
        .order_by(LiveClassMessage.created_at.desc())
        .limit(limit)
        .all()[::-1]  # oldest → newest
    )

def chat_channel(live_class_id: int) -> str:
    return f"live_class_chat:{live_class_id}"

