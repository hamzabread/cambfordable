import base64
import hashlib
import hmac
import time
from core.zoom_config import zoom_settings


def generate_zoom_sdk_signature(
    *,
    meeting_number: str,
    role: int,
) -> str:
    """
    role:
    0 = attendee
    1 = host
    """

    sdk_key = zoom_settings.ZOOM_CLIENT_ID
    sdk_secret = zoom_settings.ZOOM_CLIENT_SECRET

    timestamp = int(time.time() * 1000) - 30000

    msg = f"{sdk_key}{meeting_number}{timestamp}{role}"
    msg_bytes = msg.encode("utf-8")

    hash_bytes = hmac.new(
        sdk_secret.encode("utf-8"),
        msg_bytes,
        hashlib.sha256
    ).digest()

    hash_base64 = base64.b64encode(hash_bytes).decode("utf-8")

    signature = f"{sdk_key}.{meeting_number}.{timestamp}.{role}.{hash_base64}"
    signature_base64 = base64.b64encode(signature.encode("utf-8")).decode("utf-8")

    return signature_base64
