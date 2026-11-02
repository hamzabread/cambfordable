"""Bring Zoom's cloud recordings and attendance into the portal after each class.

Runs hourly from main.py and on demand (POST /live-classes/{id}/zoom-sync).
Each person joins Zoom with customerKey "u<user id>" (see ZoomProvider), so
the participant report maps straight back to portal accounts; email and
display name are fallbacks. When Zoom has no report (Basic plan, missing API
scope), the portal's own join heartbeats are used instead.
"""
import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

from core.zoom_api import ZoomError, get_meeting_participants, get_meeting_recording
from models.class_attendance import ClassAttendance
from models.enrollments import Enrollment
from models.live_class_sessions import LiveClassSession
from models.live_classes import LiveClass
from models.users import User

logger = logging.getLogger(__name__)

# Zoom needs a little time after a class to finish its report and recording.
SETTLE = timedelta(minutes=10)
# Keep looking for a recording this long; after that, assume there isn't one.
RECORDING_WINDOW = timedelta(days=3)
# Wait this long for Zoom's attendance report before using portal data.
ATTENDANCE_WINDOW = timedelta(hours=6)
# Never look further back than this.
LOOKBACK = timedelta(days=14)


def _utc(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    return value if value.tzinfo else value.replace(tzinfo=timezone.utc)


def _parse_time(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def _course_people(db: Session, course_id: int) -> list[User]:
    return (
        db.query(User)
        .join(Enrollment, Enrollment.user_id == User.id)
        .filter(Enrollment.course_id == course_id)
        .all()
    )


def _match_user(participant: dict, people: list[User], users_by_id: dict[int, User]) -> User | None:
    key = str(participant.get("customer_key") or "")
    if key.startswith("u") and key[1:].isdigit():
        user = users_by_id.get(int(key[1:]))
        if user:
            return user
    email = (participant.get("user_email") or "").strip().lower()
    if email:
        for person in people:
            if (person.email or "").lower() == email:
                return person
    name = (participant.get("name") or "").strip().lower()
    if name:
        matches = [
            person for person in people
            if name in {(person.full_name or "").strip().lower(), person.username.lower()}
        ]
        if len(matches) == 1:
            return matches[0]
    return None


def _save_attendance(db: Session, live_class: LiveClass, rows: list[dict], source: str) -> int:
    db.query(ClassAttendance).filter(ClassAttendance.live_class_id == live_class.id).delete()
    for row in rows:
        db.add(ClassAttendance(live_class_id=live_class.id, source=source, **row))
    live_class.attendance_synced_at = datetime.now(timezone.utc)
    db.commit()
    return len(rows)


def attendance_from_zoom(db: Session, live_class: LiveClass, participants: list[dict]) -> list[dict]:
    """One row per person: Zoom lists a separate entry every time someone rejoins."""
    people = _course_people(db, live_class.course_id)
    keys = (str(participant.get("customer_key") or "") for participant in participants)
    tagged_ids = {int(key[1:]) for key in keys if key.startswith("u") and key[1:].isdigit()}
    users_by_id = {person.id: person for person in people}
    if tagged_ids:
        users_by_id.update({user.id: user for user in db.query(User).filter(User.id.in_(tagged_ids))})

    grouped: dict[str, dict] = {}
    for participant in participants:
        user = _match_user(participant, people, users_by_id)
        key = f"user:{user.id}" if user else f"name:{(participant.get('name') or 'Unknown').strip().lower()}"
        entry = grouped.setdefault(key, {
            "user_id": user.id if user else None,
            "display_name": (user.full_name or user.username) if user else (participant.get("name") or "Unknown"),
            "seconds": 0,
            "first_join": None,
            "last_leave": None,
        })
        entry["seconds"] += int(participant.get("duration") or 0)
        joined = _parse_time(participant.get("join_time"))
        left = _parse_time(participant.get("leave_time"))
        if joined and (entry["first_join"] is None or joined < entry["first_join"]):
            entry["first_join"] = joined
        if left and (entry["last_leave"] is None or left > entry["last_leave"]):
            entry["last_leave"] = left

    class_minutes = _class_minutes(live_class)
    return [
        {
            "user_id": entry["user_id"],
            "display_name": entry["display_name"],
            # Overlapping rejoins can add up past the class length.
            "minutes": min(round(entry["seconds"] / 60), class_minutes + 60),
            "first_join": entry["first_join"],
            "last_leave": entry["last_leave"],
        }
        for entry in grouped.values()
    ]


def attendance_from_portal(db: Session, live_class: LiveClass) -> list[dict]:
    """Fallback: the classroom page's own claim/heartbeat records."""
    sessions = db.query(LiveClassSession).filter(LiveClassSession.live_class_id == live_class.id).all()
    starts_at, ends_at = _utc(live_class.starts_at), _utc(live_class.ends_at)
    grouped: dict[int, dict] = {}
    for session in sessions:
        start = max(_utc(session.started_at), starts_at)
        end = min(_utc(session.last_seen), ends_at)
        seconds = max(0, (end - start).total_seconds())
        entry = grouped.setdefault(session.user_id, {"seconds": 0, "first_join": start, "last_leave": end})
        entry["seconds"] += seconds
        entry["first_join"] = min(entry["first_join"], start)
        entry["last_leave"] = max(entry["last_leave"], end)
    users = {user.id: user for user in db.query(User).filter(User.id.in_(list(grouped) or [-1]))}
    return [
        {
            "user_id": user_id,
            "display_name": (users[user_id].full_name or users[user_id].username) if user_id in users else "Unknown",
            "minutes": round(entry["seconds"] / 60),
            "first_join": entry["first_join"],
            "last_leave": entry["last_leave"],
        }
        for user_id, entry in grouped.items()
    ]


def _class_minutes(live_class: LiveClass) -> int:
    return max(1, round((_utc(live_class.ends_at) - _utc(live_class.starts_at)).total_seconds() / 60))


def sync_recording(db: Session, live_class: LiveClass, now: datetime, force: bool = False) -> str:
    try:
        recording = get_meeting_recording(live_class.meeting_id)
    except ZoomError as error:
        logger.warning("Recording lookup failed for class %s: %s", live_class.id, error)
        return "error"
    if recording:
        live_class.recording_url = recording["share_url"]
        live_class.recording_passcode = recording["passcode"]
        live_class.recording_synced_at = now
        db.commit()
        return "found"
    if force or now - _utc(live_class.ends_at) > RECORDING_WINDOW:
        live_class.recording_synced_at = now
        db.commit()
        return "none"
    return "waiting"


def sync_attendance(db: Session, live_class: LiveClass, now: datetime, force: bool = False) -> str:
    try:
        participants = get_meeting_participants(live_class.meeting_id)
    except ZoomError as error:
        logger.warning("Attendance report failed for class %s: %s", live_class.id, error)
        participants = None
    if participants:
        _save_attendance(db, live_class, attendance_from_zoom(db, live_class, participants), "zoom")
        return "zoom"
    if force or now - _utc(live_class.ends_at) > ATTENDANCE_WINDOW:
        _save_attendance(db, live_class, attendance_from_portal(db, live_class), "portal")
        return "portal"
    return "waiting"


def sync_class(db: Session, live_class: LiveClass, now: datetime | None = None, force: bool = False) -> dict:
    now = now or datetime.now(timezone.utc)
    return {
        "recording": sync_recording(db, live_class, now, force),
        "attendance": sync_attendance(db, live_class, now, force),
    }


def run_zoom_sync(db: Session, now: datetime | None = None) -> dict:
    now = now or datetime.now(timezone.utc)
    counts = {"recordings": 0, "attendance": 0}
    classes = (
        db.query(LiveClass)
        .filter(
            LiveClass.ends_at <= now - SETTLE,
            LiveClass.ends_at >= now - LOOKBACK,
        )
        .filter((LiveClass.recording_synced_at.is_(None)) | (LiveClass.attendance_synced_at.is_(None)))
        .all()
    )
    for live_class in classes:
        if live_class.recording_synced_at is None and sync_recording(db, live_class, now) == "found":
            counts["recordings"] += 1
        if live_class.attendance_synced_at is None and sync_attendance(db, live_class, now) in {"zoom", "portal"}:
            counts["attendance"] += 1
    if any(counts.values()):
        logger.info("Zoom sync: %s", counts)
    return counts


def attendance_status(minutes: int | None, class_minutes: int) -> str:
    if not minutes:
        return "absent"
    return "present" if minutes >= class_minutes / 2 else "partial"


def class_length_minutes(live_class: LiveClass) -> int:
    return _class_minutes(live_class)


def attendance_minutes_for(db: Session, user_id: int, class_ids: list[int]) -> dict[int, int]:
    if not class_ids:
        return {}
    rows = (
        db.query(ClassAttendance.live_class_id, func.sum(ClassAttendance.minutes))
        .filter(ClassAttendance.user_id == user_id, ClassAttendance.live_class_id.in_(class_ids))
        .group_by(ClassAttendance.live_class_id)
        .all()
    )
    return {class_id: int(minutes or 0) for class_id, minutes in rows}
