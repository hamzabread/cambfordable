# core/redis.py
import os

import redis.asyncio as redis

# Set REDIS_URL on the server (Railway's Redis plugin provides one). The
# default uses 127.0.0.1, not localhost: on Windows "localhost" tries IPv6
# first and every call waits for that to fail.
redis_client = redis.from_url(
    os.getenv("REDIS_URL", "redis://127.0.0.1:6379/0"),
    decode_responses=True,
)
