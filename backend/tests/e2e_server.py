"""Backend for the browser tests (frontend/e2e): a fresh SQLite database
seeded with known accounts and courses, then the API on the given port.

    python tests/e2e_server.py --port 8010 --frontend http://localhost:3100

Never point this at a real database: it drops and recreates every table.
"""
import argparse
import os
import sys
import tempfile
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from support import install_sqlite_shims, use_test_settings  # noqa: E402

# Only valid in this throwaway database. frontend/e2e/accounts.ts uses the same value.
PASSWORD = "E2e-only-password-1"

parser = argparse.ArgumentParser()
parser.add_argument("--port", type=int, default=8010)
parser.add_argument("--frontend", default="http://localhost:3100")
args = parser.parse_args()

workdir = Path(tempfile.mkdtemp(prefix="cambfordable-e2e-"))
use_test_settings(workdir / "e2e.db", frontend_origins=f"{args.frontend},{args.frontend.replace('localhost', '127.0.0.1')}")
os.chdir(workdir)

import uvicorn  # noqa: E402

import main  # noqa: E402
from core.hashing import get_password_hash  # noqa: E402
from database import Base, SessionLocal, engine  # noqa: E402
from models.courses import Course  # noqa: E402
from models.enrollments import Enrollment  # noqa: E402
from models.live_classes import LiveClass  # noqa: E402
from models.quiz import Quiz  # noqa: E402
from models.quiz_option import QuizOption  # noqa: E402
from models.quiz_question import QuizQuestion  # noqa: E402
from models.users import User  # noqa: E402

install_sqlite_shims(engine, Base)
Base.metadata.drop_all(engine)
Base.metadata.create_all(engine)

db = SessionLocal()
now = datetime.now(timezone.utc)
hashed = get_password_hash(PASSWORD)


def add(obj):
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


admin = add(User(username="e2e_admin", email="e2e_admin@example.com", full_name="E2E Admin", hashed_password=hashed, is_admin=True))
student = add(User(username="e2e_student", email="e2e_student@example.com", full_name="Ayesha Student", hashed_password=hashed))
add(User(username="e2e_newcomer", email="e2e_newcomer@example.com", full_name="Nadia Newcomer", hashed_password=hashed))

physics = add(Course(name="E2E Physics", code="E2E-PHY"))
add(Course(name="E2E Chemistry", code="E2E-CHEM"))
add(Enrollment(user_id=admin.id, course_id=physics.id, paid=True))
add(Enrollment(user_id=student.id, course_id=physics.id, paid=True, paid_at=now, paid_until=now + timedelta(days=30)))

quiz = add(Quiz(course_id=physics.id, title="E2E Waves quiz", total_marks=2, duration_minutes=10))
question = add(QuizQuestion(quiz_id=quiz.id, question_text="What is the unit of frequency?", is_mcq=True, marks=2))
add(QuizOption(question_id=question.id, option_text="Hertz", is_correct=True))
add(QuizOption(question_id=question.id, option_text="Newton", is_correct=False))

# Running now, for the join test. The Zoom meeting itself is never contacted.
add(LiveClass(course_id=physics.id, title="E2E Live optics", starts_at=now - timedelta(minutes=5),
              ends_at=now + timedelta(hours=3), meeting_id="81000000001", meeting_password="e2e"))
db.close()

uvicorn.run(main.app, host="127.0.0.1", port=args.port, log_level="warning")
