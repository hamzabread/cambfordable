import jwt
import time
from core.zoom_config import zoom_settings

def generate_zoom_sdk_signature(
    *,
    meeting_number: str,
    role: int,
) -> str:
    """
    Generates a modern JWT signature for Zoom Meeting SDK v2.0.0+
    role: 0 = attendee, 1 = host
    """
    sdk_key = zoom_settings.ZOOM_CLIENT_ID
    sdk_secret = zoom_settings.ZOOM_CLIENT_SECRET

    # Timestamps in seconds
    iat = int(time.time()) - 30  # Issued at (30s ago to avoid clock drift issues)
    exp = iat + (60 * 60 * 2)     # Token expires in 2 hours

    # The payload MUST follow this specific structure for the Zoom SDK
    payload = {
        "sdkKey": sdk_key,
        "mn": int(meeting_number),   # Must be an integer inside the JWT
        "role": role,
        "iat": iat,
        "exp": exp,
        "appKey": sdk_key,           # Legacy support
        "tokenExp": exp
    }

    # Generate the JWT
    # Modern SDKs expect a standard JWT string, not a custom base64 concatenation
    signature = jwt.encode(
        payload, 
        sdk_secret, 
        algorithm="HS256"
    )

    return signature