# backend/core/zoom_api.py
import base64
import httpx
from fastapi import HTTPException
from datetime import datetime

from core.zoom_settings import zoom_settings  # import new S2S settings

async def get_zoom_token():
    url = f"https://zoom.us/oauth/token?grant_type=account_credentials&account_id={zoom_settings.ZOOM_ACCOUNT_ID_S2S}"

    auth_str = f"{zoom_settings.ZOOM_CLIENT_ID_S2S}:{zoom_settings.ZOOM_CLIENT_SECRET_S2S}"
    encoded_auth = base64.b64encode(auth_str.encode()).decode()

    headers = {
        "Authorization": f"Basic {encoded_auth}",
        "Content-Type": "application/x-www-form-urlencoded",
    }

    async with httpx.AsyncClient() as client:
        resp = await client.post(url, headers=headers)
        if resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get Zoom token")
        return resp.json()["access_token"]


async def create_zoom_meeting(topic: str, start_time: datetime):
    token = await get_zoom_token()
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    meeting_data = {
        "topic": topic,
        "type": 2,  # scheduled meeting
        "start_time": start_time.isoformat(),
        "duration": 60,
        "settings": {
            "host_video": True,
            "participant_video": False,     # 1. Hide student videos by default
            "mute_upon_entry": True,        # 2. Force mute everyone on join
            "participant_mic_before_host": False,
            "waiting_room": False,
            # This setting prevents participants from seeing each other in some versions
            "meeting_authentication": False, 
            "jbh_time": 0,
        },
    }

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://api.zoom.us/v2/users/me/meetings",
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
