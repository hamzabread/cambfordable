import os


ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_MINUTES = 7 * 24 * 60

SECRET_KEY = os.getenv("SECRET_KEY", "fallback-for-local-only")
ALGORITHM = os.getenv("ALGORITHM", "HS256")