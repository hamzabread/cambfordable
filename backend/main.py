from fastapi import FastAPI

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
from database import engine, Base
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8081",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:8081",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "https://meramusafir.vercel.app",
        "http://127.0.0.1:8000",
        "https://mera-musafir-web.vercel.app",
        "https://cambfordable-production.up.railway.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads/quiz_answers"
os.makedirs(UPLOAD_DIR, exist_ok=True)

Base.metadata.create_all(bind=engine)

# IMPORTANT: Include all routers BEFORE mounting static files
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
app.include_router(uploads_router)  # This MUST come before the static mount

# Mount static files LAST - this catches any remaining /uploads/* GET requests
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/")
async def read_root():
    return {"Title": "Cambfordable"}