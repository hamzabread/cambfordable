"""Shared setup for the backend tests. Every test runs against a fresh
SQLite database in a temporary folder, never a real database."""
import os
import tempfile
from pathlib import Path

from support import install_sqlite_shims, use_test_settings

WORKDIR = Path(tempfile.mkdtemp(prefix="cambfordable-tests-"))
use_test_settings(WORKDIR / "test.db")

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import text  # noqa: E402

import main  # noqa: E402
from database import Base, SessionLocal, engine  # noqa: E402

install_sqlite_shims(engine, Base)


def _reset_in_memory_state():
    """Rate limiters and other per-process state that would leak between tests."""
    from routers import auth, contact, live_classes, threads, websocket

    for limiter in (auth.login_failures, auth.address_failures, auth.reset_requests, threads.post_limit):
        limiter.hits.clear()
    contact.recent_messages.clear()
    websocket.rate_limit.clear()
    live_classes.classes_being_created.clear()


@pytest.fixture(scope="session", autouse=True)
def upload_folder():
    """Uploads are saved relative to the working directory, so tests run
    from the temporary folder and never write into backend/uploads."""
    from routers import uploads

    previous = os.getcwd()
    os.chdir(WORKDIR)
    for directory in (
        uploads.QUIZ_UPLOAD_DIR, uploads.HOMEWORK_UPLOAD_DIR, uploads.HOMEWORK_IMAGES_DIR, uploads.QUIZ_IMAGES_DIR,
        uploads.LIVE_CLASSES_UPLOAD_DIR, uploads.SOLUTIONS_UPLOAD_DIR, uploads.PAYMENT_UPLOAD_DIR,
    ):
        os.makedirs(directory, exist_ok=True)
    yield WORKDIR
    os.chdir(previous)


@pytest.fixture(autouse=True)
def fresh_database():
    with engine.begin() as connection:
        # Exists on Railway but isn't modeled; a test creates it when needed.
        connection.execute(text("DROP TABLE IF EXISTS class_materials"))
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    _reset_in_memory_state()
    yield
    engine.dispose()


@pytest.fixture
def client():
    return TestClient(main.app, raise_server_exceptions=False)


@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()


class Checks:
    """Collects many small checks in one scenario and reports every failure,
    not just the first, so one run shows everything that broke."""

    def __init__(self):
        self.failures: list[str] = []
        self.count = 0

    def __call__(self, label, got, want):
        self.count += 1
        if got != want:
            self.failures.append(f"{label}: got {got!r}, wanted {want!r}")


@pytest.fixture
def check():
    checks = Checks()
    yield checks
    if checks.failures:
        pytest.fail(
            f"{len(checks.failures)} of {checks.count} checks failed:\n  " + "\n  ".join(checks.failures),
            pytrace=False,
        )
