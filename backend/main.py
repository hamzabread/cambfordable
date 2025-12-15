from fastapi import FastAPI
from routers.auth import router as auth_router
from routers.users import router as users_router
from routers.courses import router as courses_router
from routers.live_classes import router as live_classes_router
from routers.homework import router as homework_router
from database import engine, Base
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8081",      # Expo web dev server
        "http://localhost:3000",      # React dev server
        "http://localhost:5173",      # Vite dev server
        "http://127.0.0.1:8081",      # Alternative localhost
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "https://meramusafir.vercel.app",
        "http://127.0.0.1:8000",
        "https://mera-musafir-web.vercel.app"
      
    ],
    allow_credentials=True,
    allow_methods=["*"],              # Allow all HTTP methods
    allow_headers=["*"],              # Allow all headers
)


Base.metadata.create_all(bind=engine)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(courses_router)
app.include_router(live_classes_router)
app.include_router(homework_router)

@app.get("/")
async def read_root():
    return {"Title": "Cambfordable"}
