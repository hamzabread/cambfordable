# backend/core/zoom_api.py
import base64
import time
from datetime import datetime
from urllib.parse import quote

import httpx
from fastapi import HTTPException

from core.zoom_settings import zoom_settings  # import new S2S settings

API_BASE = "https://api.zoom.us/v2"


class ZoomError(Exception):
    """Zoom answered with an error other than "not found"."""


def _basic_auth() -> str:
    auth_str = f"{zoom_settings.ZOOM_CLIENT_ID_S2S}:{zoom_settings.ZOOM_CLIENT_SECRET_S2S}"
    return base64.b64encode(auth_str.encode()).decode()


def _token_url() -> str:
    return f"https://zoom.us/oauth/token?grant_type=account_credentials&account_id={zoom_settings.ZOOM_ACCOUNT_ID_S2S}"


async def get_zoom_token():
    headers = {
        "Authorization": f"Basic {_basic_auth()}",
        "Content-Type": "application/x-www-form-urlencoded",
    }

    async with httpx.AsyncClient() as client:
        resp = await client.post(_token_url(), headers=headers)
        if resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get Zoom token")
        return resp.json()["access_token"]


async def create_zoom_meeting(topic: str, start_time: datetime, duration: int = 60):
    token = await get_zoom_token()
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    meeting_data = {
        "topic": topic,
        "type": 2,  # scheduled meeting
        "start_time": start_time.isoformat(),
        "duration": duration,
        "settings": {
            "host_video": True,
            "participant_video": False,     # 1. Hide student videos by default
            "mute_upon_entry": True,        # 2. Force mute everyone on join
            "participant_mic_before_host": False,
            "waiting_room": False,
            # This setting prevents participants from seeing each other in some versions
            "meeting_authentication": False,
            "jbh_time": 0,
            # Recordings are posted to Past Classes automatically (crud/zoom_sync.py).
            # Cloud recording needs a paid Zoom plan; on Basic, Zoom ignores this.
            "auto_recording": "cloud",
        },
    }

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{API_BASE}/users/me/meetings",
            headers=headers,
            json=meeting_data,
        )
        if resp.status_code != 201:
            raise HTTPException(status_code=400, detail=resp.json())

        data = resp.json()
        return {
            "meeting_id": data["id"],
            "password": data.get("password"),  # Add this line!
            "join_url": data["join_url"],
            "start_url": data["start_url"],
        }


# ── Synchronous helpers for the hourly background job ─────────────────

_token_cache: dict = {"token": None, "expires": 0.0}


def _sync_token() -> str:
    if _token_cache["token"] and _token_cache["expires"] > time.time() + 60:
        return _token_cache["token"]
    try:
        resp = httpx.post(
            _token_url(),
            headers={"Authorization": f"Basic {_basic_auth()}", "Content-Type": "application/x-www-form-urlencoded"},
            timeout=20,
        )
    except httpx.HTTPError as error:
        raise ZoomError(f"Couldn't reach Zoom: {error}") from error
    if resp.status_code != 200:
        raise ZoomError(f"Zoom token request failed ({resp.status_code})")
    data = resp.json()
    _token_cache["token"] = data["access_token"]
    _token_cache["expires"] = time.time() + int(data.get("expires_in", 3600))
    return _token_cache["token"]


def _get(path: str, params: dict | None = None) -> dict | None:
    """GET from the Zoom API. None means Zoom has nothing (yet) for this meeting."""
    try:
        resp = httpx.get(
            f"{API_BASE}{path}",
            headers={"Authorization": f"Bearer {_sync_token()}"},
            params=params,
            timeout=30,
        )
    except httpx.HTTPError as error:
        raise ZoomError(f"Couldn't reach Zoom: {error}") from error
    if resp.status_code == 404:
        return None
    if resp.status_code >= 400:
        try:
            message = resp.json().get("message", resp.text)
        except ValueError:
            message = resp.text
        raise ZoomError(f"Zoom {path} failed ({resp.status_code}): {message}")
    return resp.json()


def get_meeting_recording(meeting_id: str) -> dict | None:
    """The cloud recording's share link and passcode, or None if there is none yet."""
    data = _get(f"/meetings/{quote(str(meeting_id), safe='')}/recordings")
    if not data or not data.get("share_url"):
        return None
    share_url = data["share_url"]
    # The play passcode, appended as pwd=, opens the recording without
    # asking for the passcode.
    play_passcode = data.get("recording_play_passcode")
    if play_passcode:
        share_url += ("&" if "?" in share_url else "?") + f"pwd={quote(play_passcode, safe='')}"
    return {
        "share_url": share_url,
        "passcode": data.get("password"),
        "files": len(data.get("recording_files") or []),
    }


def get_meeting_participants(meeting_id: str) -> list[dict] | None:
    """Everyone who joined the meeting, with join/leave times and seconds attended.
    Uses the meeting report (paid Zoom plan, report:read scope)."""
    participants: list[dict] = []
    next_token = ""
    while True:
        params = {"page_size": 300}
        if next_token:
            params["next_page_token"] = next_token
        data = _get(f"/report/meetings/{quote(str(meeting_id), safe='')}/participants", params)
        if data is None:
            return None if not participants else participants
        participants.extend(data.get("participants") or [])
        next_token = data.get("next_page_token") or ""
        if not next_token:
            return participants


def delete_zoom_meeting(meeting_id: str) -> bool:
    """Best effort: cancel the Zoom meeting when its class is deleted."""
    try:
        resp = httpx.delete(
            f"{API_BASE}/meetings/{quote(str(meeting_id), safe='')}",
            headers={"Authorization": f"Bearer {_sync_token()}"},
            timeout=20,
        )
        return resp.status_code in (204, 404)
    except Exception:
        return False
