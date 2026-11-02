import logging
import os
import secrets


ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_MINUTES = 7 * 24 * 60

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    # Never fall back to a fixed value: it would be public in the repository
    # and let anyone sign their own admin token. A random key keeps things
    # safe, but every restart signs everyone out, so set SECRET_KEY.
    SECRET_KEY = secrets.token_urlsafe(64)
    logging.getLogger(__name__).warning(
        "SECRET_KEY is not set; using a temporary key. Everyone is signed out on restart."
    )
ALGORITHM = os.getenv("ALGORITHM", "HS256")
