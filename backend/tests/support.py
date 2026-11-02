"""Test-only settings and SQLite shims, shared by the pytest suite and the
browser-test server (tests/e2e_server.py).

Import this before anything from the app: it sets the environment the app
reads at import time. database.py's load_dotenv never overrides a variable
that is already set, so a developer's backend/.env can't leak real
credentials (or real email and WhatsApp sending) into a test run.
"""
import os
import sys
from datetime import timezone
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]

TEST_SETTINGS = {
    "SECRET_KEY": "test-only-secret-key-0123456789abcdef0123456789abcdef",
    "ALGORITHM": "HS256",
    "ACCESS_TOKEN_EXPIRE_MINUTES": "30",
    "REFRESH_TOKEN_EXPIRE_MINUTES": "10080",
    "BILLING_JOB_DISABLED": "true",
    "ZOOM_CLIENT_ID": "test-sdk-key",
    "ZOOM_CLIENT_SECRET": "test-sdk-secret",
    "ZOOM_ACCOUNT_ID_S2S": "test-account",
    "ZOOM_CLIENT_ID_S2S": "test-client",
    "ZOOM_CLIENT_SECRET_S2S": "test-secret",
    "JAZZCASH_MERCHANT_ID": "test-merchant",
    "JAZZCASH_PASSWORD": "test-password",
    "JAZZCASH_INTEGRITY_SALT": "test-salt",
    "JAZZCASH_PAYMENT_URL": "https://sandbox.example/pay",
    "JAZZCASH_RETURN_URL": "http://localhost:3000/payments/return",
    # Blank on purpose: no real email or WhatsApp messages from tests.
    "SMTP_USERNAME": "",
    "SMTP_PASSWORD": "",
    "TWILIO_ACCOUNT_SID": "",
    "TWILIO_AUTH_TOKEN": "",
}


def use_test_settings(database_path: Path, frontend_origins: str = "") -> None:
    os.environ.update(TEST_SETTINGS)
    os.environ["DATABASE_URL"] = f"sqlite:///{database_path.as_posix()}"
    os.environ["FRONTEND_ORIGINS"] = frontend_origins
    os.environ.pop("ENABLE_API_DOCS", None)
    os.environ.setdefault("REDIS_URL", "redis://127.0.0.1:6379/0")
    if str(BACKEND) not in sys.path:
        sys.path.insert(0, str(BACKEND))


def install_sqlite_shims(engine, base) -> None:
    """Make SQLite behave like Postgres where the app depends on it."""
    from sqlalchemy import DateTime, event
    from sqlalchemy.orm.attributes import set_committed_value

    assert engine.url.drivername == "sqlite", "tests must never run against a real database"

    @event.listens_for(engine, "connect")
    def _enforce_foreign_keys(dbapi_connection, _record):
        dbapi_connection.execute("PRAGMA foreign_keys=ON")

    def restore_utc(columns):
        def restore(target, _context, *_attrs):
            for column in columns:
                value = getattr(target, column, None)
                if value is not None and value.tzinfo is None:
                    set_committed_value(target, column, value.replace(tzinfo=timezone.utc))

        return restore

    # SQLite drops timezones; Postgres keeps them.
    for mapper in base.registry.mappers:
        columns = [column.key for column in mapper.columns if isinstance(column.type, DateTime)]
        if columns:
            event.listen(mapper.class_, "load", restore_utc(columns))
            event.listen(mapper.class_, "refresh", restore_utc(columns))
