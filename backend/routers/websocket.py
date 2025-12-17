from fastapi import WebSocket, WebSocketDisconnect, Depends, APIRouter
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from database import get_db
from core.security import get_current_user_ws, get_current_user
from models.live_classes import LiveClass
from crud.live_chat import create_live_chat_message, get_live_chat_messages, chat_channel
from models.enrollments import Enrollment
from models.users import User
from time import time
from schemas.live_class_messages import LiveChatMessageOut
from core.redis import redis_client
import json
import asyncio

router = APIRouter(prefix="/chat", tags=["Chat"])

# live_class_id -> list of connections
active_connections: dict[int, list[dict]] = {}

# user_id -> last message timestamp
rate_limit: dict[int, float] = {}

redis_tasks: dict[int, asyncio.Task] = {}

async def redis_listener(live_class_id: int):
    pubsub = redis_client.pubsub()
    await pubsub.subscribe(chat_channel(live_class_id))

    try:
        async for message in pubsub.listen():
            if message["type"] != "message":
                continue

            payload = json.loads(message["data"])

            for conn in active_connections.get(live_class_id, []):
                if payload["is_admin"]:
                    await conn["ws"].send_json(payload)
                elif conn["is_admin"]:
                    await conn["ws"].send_json(payload)

    finally:
        await pubsub.unsubscribe(chat_channel(live_class_id))
        await pubsub.close()



@router.websocket("/ws/live-classes/{live_class_id}/chat")
async def live_class_chat(
    websocket: WebSocket,
    live_class_id: int,
    db: Session = Depends(get_db)
):
    # ✅ Always accept FIRST
    await websocket.accept()

    # ✅ Authenticate user
    try:
        user = await get_current_user_ws(websocket, db)
    except Exception:
        await websocket.close(code=1008)
        return

    # ✅ Validate live class
    live_class = db.query(LiveClass).get(live_class_id)
    if not live_class:
        await websocket.close(code=1008)
        return

    # ✅ Authorization rules
    if not user.is_admin:
        # Students must be enrolled
        enrollment = db.query(Enrollment).filter(
            Enrollment.user_id == user.id,
            Enrollment.course_id == live_class.course_id
        ).first()

        if not enrollment:
            await websocket.close(code=1008)
            return

        # Students can only join when class is live
        now = datetime.now(timezone.utc)
        if not (live_class.starts_at <= now <= live_class.ends_at):
            await websocket.close(code=1008)
            return

        # ✅ Register connection
    if live_class_id not in active_connections:
        active_connections[live_class_id] = []
        redis_tasks[live_class_id] = asyncio.create_task(
            redis_listener(live_class_id)
        )

    active_connections[live_class_id].append({
        "ws": websocket,
        "user_id": user.id,
        "is_admin": user.is_admin
    })


    try:
        while True:
            data = await websocket.receive_text()

            # ⏱ Rate limiting: 1 msg/sec per user
            now_ts = time()
            last_ts = rate_limit.get(user.id, 0)
            if now_ts - last_ts < 1.0:
                continue
            rate_limit[user.id] = now_ts

            # 💾 Save message
            msg = create_live_chat_message(
                db,
                live_class_id=live_class_id,
                user_id=user.id,
                message=data
            )

            payload = {
                "id": msg.id,
                "user_id": user.id,
                "message": msg.message,
                "created_at": msg.created_at.isoformat(),
                "is_admin": user.is_admin,
            }
            
            await redis_client.publish(
                chat_channel(live_class_id),
                json.dumps(payload)
            )



    except WebSocketDisconnect:
        active_connections[live_class_id] = [
            c for c in active_connections[live_class_id]
            if c["ws"] != websocket
        ]

        if not active_connections[live_class_id]:
            del active_connections[live_class_id]

            task = redis_tasks.pop(live_class_id, None)
            if task:
                task.cancel()


# routers/chat.py
@router.get(
    "/{live_class_id}/messages",
    response_model=list[LiveChatMessageOut]
)
def get_chat_history(
    live_class_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Optional: reuse same enrollment checks
    return get_live_chat_messages(db, live_class_id)
