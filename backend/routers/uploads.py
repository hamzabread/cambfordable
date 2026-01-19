from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from fastapi.responses import FileResponse
from core.security import get_current_user
import uuid
import shutil
import os

router = APIRouter(prefix="/uploads", tags=["Uploads"])

# Define directories
QUIZ_UPLOAD_DIR = "uploads/quiz_answers"
HOMEWORK_UPLOAD_DIR = "uploads/homeworks"

# Ensure directories exist
os.makedirs(QUIZ_UPLOAD_DIR, exist_ok=True)
os.makedirs(HOMEWORK_UPLOAD_DIR, exist_ok=True)

# --- HELPER FUNCTION FOR FILE SAVING ---
def save_file(file: UploadFile, destination_dir: str) -> str:
    original_name = file.filename
    ext = original_name.split(".")[-1] if "." in original_name else ""
    name_without_ext = original_name.rsplit(".", 1)[0] if "." in original_name else original_name
    
    unique_id = str(uuid.uuid4())[:8]
    filename = f"{name_without_ext}_{unique_id}.{ext}" if ext else f"{name_without_ext}_{unique_id}"
    
    # Simple sanitization
    filename = "".join(c for c in filename if c.isalnum() or c in "._- ")
    path = os.path.join(destination_dir, filename)

    with open(path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return path

# --- QUIZ ENDPOINTS (EXISTING) ---
@router.post("/quiz-answer")
def upload_quiz_answer_file(file: UploadFile = File(...), user = Depends(get_current_user)):
    path = save_file(file, QUIZ_UPLOAD_DIR)
    return {"file_url": f"/{path}", "original_filename": file.filename}

@router.get("/quiz_answers/{filename}")
def download_quiz_answer(filename: str, user = Depends(get_current_user)):
    file_path = os.path.join(QUIZ_UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path=file_path, filename=filename)


# --- HOMEWORK ENDPOINTS (NEW) ---

@router.post("/homeworks")
def upload_homework_file(file: UploadFile = File(...), user = Depends(get_current_user)):
    """Upload a homework file"""
    path = save_file(file, HOMEWORK_UPLOAD_DIR)
    # Returns /uploads/homeworks/filename.pdf
    return {"file_url": f"/{path}", "original_filename": file.filename}

# routers/uploads.py

# backend/routers/uploads.py

@router.get("/homeworks/{filename}")
def download_homework(filename: str):
    # This specifically looks inside the 'uploads/homeworks' folder
    file_path = os.path.join(HOMEWORK_UPLOAD_DIR, filename)
    
    if not os.path.exists(file_path):
        # Fallback: check the base uploads folder
        fallback_path = os.path.join("uploads", filename)
        if os.path.exists(fallback_path):
            return FileResponse(fallback_path)
        raise HTTPException(status_code=404, detail="Homework file not found")
        
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type='application/octet-stream'
    )

# routers/uploads.py

@router.get("/{filename}")  # This catches /uploads/profile.jpeg
def get_root_upload(filename: str):
    file_path = os.path.join("uploads", filename)
    if os.path.exists(file_path):
        return FileResponse(file_path)
    
    # Also check homeworks folder as a fallback
    hw_path = os.path.join(HOMEWORK_UPLOAD_DIR, filename)
    if os.path.exists(hw_path):
        return FileResponse(hw_path)
        
    raise HTTPException(status_code=404, detail="File not found")