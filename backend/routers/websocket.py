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
from json import JSONDecodeError

router = APIRouter(prefix="/chat", tags=["Chat"])

# live_class_id -> list of connections
active_connections: dict[int, list[dict]] = {}

# user_id -> last message timestamp
rate_limit: dict[int, float] = {}

redis_tasks: dict[int, asyncio.Task] = {}

# live_class_id -> active question state (in-memory, phase 1)
active_questions: dict[int, dict] = {}


def build_question_stats(question_state: dict) -> dict:
    options = question_state["options"]
    counts = [0] * len(options)
    for selected in question_state["responses"].values():
        if 0 <= selected < len(options):
            counts[selected] += 1

    return {
        "counts": counts,
        "total_responses": len(question_state["responses"]),
    }


async def publish_event(live_class_id: int, payload: dict):
    await redis_client.publish(
        chat_channel(live_class_id),
        json.dumps(payload)
    )

async def redis_listener(live_class_id: int):
    pubsub = redis_client.pubsub()
    await pubsub.subscribe(chat_channel(live_class_id))

    try:
        async for message in pubsub.listen():
            if message["type"] != "message":
                continue

            payload = json.loads(message["data"])
            event_type = payload.get("event_type", "chat")
            visibility = payload.get("visibility", "chat_filter")
            target_user_id = payload.get("target_user_id")

            # Broadcast to all connected users, but each client decides what to show
            for conn in active_connections.get(live_class_id, []):
                # Broadcast event to all connected users
                if visibility == "all":
                    await conn["ws"].send_json(payload)
                # Broadcast only to admins
                elif visibility == "admins" and conn["is_admin"]:
                    await conn["ws"].send_json(payload)
                # Broadcast only to a specific user
                elif visibility == "user" and target_user_id == conn["user_id"]:
                    await conn["ws"].send_json(payload)
                # Backward-compatible chat filtering behavior
                elif visibility == "chat_filter" and event_type == "chat":
                    if conn["is_admin"]:
                        await conn["ws"].send_json(payload)
                    elif payload.get("is_admin") or payload.get("user_id") == conn["user_id"]:
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
    # ✅ Authorization rules
    if not user.is_admin:
        enrollment = db.query(Enrollment).filter(
            Enrollment.user_id == user.id,
            Enrollment.course_id == live_class.course_id
        ).first()

        if not enrollment:
            print(f"User {user.id} denied: No enrollment for class {live_class_id}")
            await websocket.close(code=1008)
            return

        now = datetime.now(timezone.utc)
        if not (live_class.starts_at <= now <= live_class.ends_at):
            print(f"User {user.id} denied: Class {live_class_id} is not live")
            await websocket.close(code=1008)
            return

    # ✅ Register connection — OUTSIDE the if not user.is_admin block
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

    # Send active question state to the newly connected user (if any)
    active_question = active_questions.get(live_class_id)
    if active_question and active_question.get("is_active"):
        user_answer = active_question["responses"].get(user.id)
        await websocket.send_json({
            "event_type": "question_sync",
            "question_id": active_question["id"],
            "question": active_question["question"],
            "options": active_question["options"],
            "is_active": True,
            "user_answer": user_answer,
        })

        if user.is_admin:
            stats = build_question_stats(active_question)
            await websocket.send_json({
                "event_type": "question_stats",
                "question_id": active_question["id"],
                **stats,
            })


    try:
        while True:
            data = await websocket.receive_text()

            parsed_data = None
            try:
                parsed_data = json.loads(data)
            except JSONDecodeError:
                parsed_data = None

            # Handle phase-1 live question events
            if isinstance(parsed_data, dict) and parsed_data.get("action"):
                action = parsed_data["action"]

                if action == "question_publish":
                    if not user.is_admin:
                        continue

                    question = str(parsed_data.get("question", "")).strip()
                    options = parsed_data.get("options", [])
                    correct_option = parsed_data.get("correct_option")

                    if (
                        not question
                        or not isinstance(options, list)
                        or len(options) < 2
                        or not all(str(opt).strip() for opt in options)
                    ):
                        continue

                    try:
                        correct_option = int(correct_option)
                    except (TypeError, ValueError):
                        continue

                    if correct_option < 0 or correct_option >= len(options):
                        continue

                    question_state = {
                        "id": int(time() * 1000),
                        "question": question,
                        "options": [str(opt).strip() for opt in options],
                        "correct_option": correct_option,
                        "responses": {},
                        "is_active": True,
                    }
                    active_questions[live_class_id] = question_state

                    await publish_event(live_class_id, {
                        "event_type": "question_publish",
                        "visibility": "all",
                        "question_id": question_state["id"],
                        "question": question_state["question"],
                        "options": question_state["options"],
                        "is_active": True,
                    })

                    await publish_event(live_class_id, {
                        "event_type": "question_stats",
                        "visibility": "admins",
                        "question_id": question_state["id"],
                        "counts": [0] * len(question_state["options"]),
                        "total_responses": 0,
                    })
                    continue

                if action == "question_submit":
                    if user.is_admin:
                        continue

                    question_state = active_questions.get(live_class_id)
                    if not question_state or not question_state.get("is_active"):
                        continue

                    try:
                        selected_option = int(parsed_data.get("selected_option"))
                    except (TypeError, ValueError):
                        continue

                    if selected_option < 0 or selected_option >= len(question_state["options"]):
                        continue

                    # One submission per student in phase 1
                    if user.id in question_state["responses"]:
                        selected_option = question_state["responses"][user.id]
                    else:
                        question_state["responses"][user.id] = selected_option

                    stats = build_question_stats(question_state)

                    await publish_event(live_class_id, {
                        "event_type": "question_stats",
                        "visibility": "admins",
                        "question_id": question_state["id"],
                        **stats,
                    })

                    await websocket.send_json({
                        "event_type": "question_ack",
                        "question_id": question_state["id"],
                        "selected_option": selected_option,
                        "is_correct": selected_option == question_state["correct_option"],
                        "correct_option": question_state["correct_option"],
                    })
                    continue

                if action == "question_end":
                    if not user.is_admin:
                        continue

                    question_state = active_questions.get(live_class_id)
                    if not question_state:
                        continue

                    stats = build_question_stats(question_state)

                    await publish_event(live_class_id, {
                        "event_type": "question_end",
                        "visibility": "all",
                        "question_id": question_state["id"],
                        "question": question_state["question"],
                        "options": question_state["options"],
                        "correct_option": question_state["correct_option"],
                        **stats,
                    })

                    active_questions.pop(live_class_id, None)
                    continue

                if action == "question_sync_request":
                    question_state = active_questions.get(live_class_id)
                    if question_state and question_state.get("is_active"):
                        user_answer = question_state["responses"].get(user.id)
                        await websocket.send_json({
                            "event_type": "question_sync",
                            "question_id": question_state["id"],
                            "question": question_state["question"],
                            "options": question_state["options"],
                            "is_active": True,
                            "user_answer": user_answer,
                        })

                        if user.is_admin:
                            stats = build_question_stats(question_state)
                            await websocket.send_json({
                                "event_type": "question_stats",
                                "question_id": question_state["id"],
                                **stats,
                            })
                    continue

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
                message=data,
                is_admin=user.is_admin
            )

            payload = {
                "event_type": "chat",
                "visibility": "chat_filter",
                "id": msg.id,
                "user_id": user.id,
                "message": msg.message,
                "created_at": msg.created_at.isoformat(),
                "is_admin": user.is_admin,
            }

            await publish_event(live_class_id, payload)



    except WebSocketDisconnect:
        active_connections[live_class_id] = [
            c for c in active_connections[live_class_id]
            if c["ws"] != websocket
        ]

        if not active_connections[live_class_id]:
            del active_connections[live_class_id]
            active_questions.pop(live_class_id, None)

            task = redis_tasks.pop(live_class_id, None)
            if task:
                task.cancel()


# routers/chat.py
@router.get("/{live_class_id}/messages", response_model=list[LiveChatMessageOut])
def get_chat_history(
    live_class_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    messages = get_live_chat_messages(db, live_class_id)
    if user.is_admin:
        return messages
    # Students only see admin messages and their own
    return [m for m in messages if m.user_id == user.id or m.is_admin]
