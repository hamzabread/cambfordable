import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from starlette.concurrency import run_in_threadpool
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from routers.auth import router as auth_router
from routers.users import router as users_router
from routers.courses import router as courses_router
from routers.live_classes import router as live_classes_router
from routers.homework import router as homework_router
from routers.websocket import router as websocket_router
from routers.payments import router as payments_router
from routers.admin_courses import router as admin_courses_router
from routers.quiz_submissions import router as quiz_submissions_router
from routers.quizzes import router as quizzes_router
from routers.uploads import router as uploads_router
from routers.ta import router as ta_router
from routers.whatsapp_admin import router as whatsapp_admin_router
from routers.user_profile import router as user_profile_router
from routers.notifications import router as notifications_router
from routers.results import router as results_router
from routers.contact import router as contact_router
from routers.threads import router as threads_router
from fastapi.middleware.cors import CORSMiddleware
import logging
import os

logger = logging.getLogger(__name__)

# The interactive API docs list every endpoint, so they stay off unless
# ENABLE_API_DOCS=true (set it locally, not on Railway).
docs_enabled = os.getenv("ENABLE_API_DOCS", "").lower() in {"1", "true", "yes"}

BILLING_INTERVAL_SECONDS = 60 * 60


def _run_billing_once() -> None:
    from crud.billing import run_billing_cycle
    from database import SessionLocal

    db = SessionLocal()
    try:
        run_billing_cycle(db)
    finally:
        db.close()


def _run_zoom_sync_once() -> None:
    from crud.zoom_sync import run_zoom_sync
    from database import SessionLocal

    db = SessionLocal()
    try:
        run_zoom_sync(db)
    finally:
        db.close()


async def _billing_loop() -> None:
    """Hourly: payment reminders, overdue notices, pauses, removals and
    deleting proofs older than a year (crud/billing.py); then recordings and
    attendance for classes that have ended (crud/zoom_sync.py)."""
    await asyncio.sleep(60)
    while True:
        for job, name in ((_run_billing_once, "Billing cycle"), (_run_zoom_sync_once, "Zoom sync")):
            try:
                await run_in_threadpool(job)
            except Exception:
                logger.exception("%s failed", name)
        await asyncio.sleep(BILLING_INTERVAL_SECONDS)


@asynccontextmanager
async def lifespan(app: FastAPI):
    task = None
    if os.getenv("BILLING_JOB_DISABLED", "").lower() not in {"1", "true", "yes"}:
        task = asyncio.create_task(_billing_loop())
    yield
    if task:
        task.cancel()


app = FastAPI(
    lifespan=lifespan,
    docs_url="/docs" if docs_enabled else None,
    redoc_url="/redoc" if docs_enabled else None,
    openapi_url="/openapi.json" if docs_enabled else None,
)

# Extra deployed frontends go in FRONTEND_ORIGINS, comma separated.
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://cambfordable-production.up.railway.app",
    *[origin.strip() for origin in os.getenv("FRONTEND_ORIGINS", "").split(",") if origin.strip()],
]

@app.middleware("http")
async def unexpected_errors(request: Request, call_next):
    # Registered before CORS so it runs inside it: a crash then still reaches
    # the browser with CORS headers, as a 500 it can show, not a network error.
    try:
        return await call_next(request)
    except Exception:
        logger.exception("Unhandled error on %s %s", request.method, request.url.path)
        return JSONResponse(status_code=500, content={"detail": "Something went wrong on our side. Please try again."})


app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    if request.url.scheme == "https" or request.headers.get("x-forwarded-proto") == "https":
        response.headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
    return response


FIELD_LABELS = {
    "username": "Username",
    "email": "Email",
    "full_name": "Full name",
    "password": "Password",
    "new_password": "New password",
    "current_password": "Current password",
    "phone_number": "Phone number",
    "date_of_birth": "Date of birth",
    "permanent_address": "Address",
    "nationality": "Nationality",
    "gender": "Gender",
    "title": "Title",
    "name": "Name",
    "code": "Course code",
    "duration": "Duration",
    "due_date": "Due date",
    "deadline": "Deadline",
}


def _readable_error(error: dict) -> str:
    message = str(error.get("msg", "Invalid value"))
    if message.startswith("Value error, "):
        message = message[len("Value error, "):]
    if message.startswith("Assertion failed, "):
        message = message[len("Assertion failed, "):]
    field = next((str(part) for part in reversed(error.get("loc", ())) if isinstance(part, str) and part != "body"), "")
    label = FIELD_LABELS.get(field, field.replace("_", " ").capitalize())
    if not label:
        return message
    if message.startswith(label):
        return message
    return f"{label}: {message[0].lower()}{message[1:]}" if message else label


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    errors = jsonable_encoder(exc.errors(), exclude={"input", "ctx", "url"})
    for error in errors:
        error["msg"] = _readable_error(error)
    return JSONResponse(status_code=422, content={"detail": errors})


UPLOAD_DIR = "uploads/quiz_answers"
os.makedirs(UPLOAD_DIR, exist_ok=True)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(courses_router)
app.include_router(live_classes_router)
app.include_router(homework_router)
app.include_router(websocket_router)
app.include_router(payments_router)
app.include_router(admin_courses_router)
app.include_router(quiz_submissions_router)
app.include_router(quizzes_router)
app.include_router(uploads_router)
app.include_router(ta_router)
app.include_router(whatsapp_admin_router)
app.include_router(user_profile_router)
app.include_router(notifications_router)
app.include_router(results_router)
app.include_router(contact_router)
app.include_router(threads_router)

@app.get("/")
async def read_root():
    return {"Title": "Cambfordable"}
