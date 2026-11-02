from collections import defaultdict
from time import time

from fastapi import HTTPException, Request, status


def client_address(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


class SlidingWindowLimiter:
    """In-memory per-key limiter. Counts reset when the process restarts, which
    is acceptable for a single backend instance."""

    def __init__(self, limit: int, window_seconds: int, message: str):
        self.limit = limit
        self.window = window_seconds
        self.message = message
        self.hits: dict[str, list[float]] = defaultdict(list)

    def _recent(self, key: str) -> list[float]:
        cutoff = time() - self.window
        recent = [hit for hit in self.hits[key] if hit > cutoff]
        if recent:
            self.hits[key] = recent
        else:
            self.hits.pop(key, None)
        return recent

    def check(self, *keys: str) -> None:
        for key in keys:
            recent = self._recent(key)
            if len(recent) >= self.limit:
                retry_after = int(recent[0] + self.window - time()) + 1
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=self.message,
                    headers={"Retry-After": str(max(retry_after, 1))},
                )

    def hit(self, *keys: str) -> None:
        now = time()
        for key in keys:
            self.hits[key].append(now)

    def reset(self, *keys: str) -> None:
        for key in keys:
            self.hits.pop(key, None)
