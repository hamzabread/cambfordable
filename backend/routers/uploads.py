from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Query
from fastapi.responses import FileResponse, StreamingResponse
from core.security import get_current_user
import mimetypes
import uuid
import shutil
import os

router = APIRouter(prefix="/uploads", tags=["Uploads"])

# Define directories
QUIZ_UPLOAD_DIR = "uploads/quiz_answers"
HOMEWORK_UPLOAD_DIR = "uploads/homeworks"
HOMEWORK_IMAGES_DIR = "uploads/homework_images"
QUIZ_IMAGES_DIR = "uploads/quiz_images"
LIVE_CLASSES_UPLOAD_DIR = "uploads/live_classes"
SOLUTIONS_UPLOAD_DIR = "uploads/solutions"
PAYMENT_UPLOAD_DIR = "uploads/payments"

# Ensure directories exist
os.makedirs(QUIZ_UPLOAD_DIR, exist_ok=True)
os.makedirs(HOMEWORK_UPLOAD_DIR, exist_ok=True)
os.makedirs(HOMEWORK_IMAGES_DIR, exist_ok=True)
os.makedirs(QUIZ_IMAGES_DIR, exist_ok=True)
os.makedirs(LIVE_CLASSES_UPLOAD_DIR, exist_ok=True)
os.makedirs(SOLUTIONS_UPLOAD_DIR, exist_ok=True)
os.makedirs(PAYMENT_UPLOAD_DIR, exist_ok=True)


def _guess_media_type(filename: str) -> str:
    """Return a browser-friendly MIME type for common file extensions."""
    mt, _ = mimetypes.guess_type(filename)
    return mt or "application/octet-stream"


def serve_file(file_path: str, filename: str, mode: str = "download") -> FileResponse:
    """
    Return a FileResponse.
    mode="view"   → Content-Disposition: inline  (browser opens it)
    mode="download"→ Content-Disposition: attachment (browser downloads)
    """
    if mode == "view":
        media = _guess_media_type(filename)
        return FileResponse(
            path=file_path,
            filename=filename,
            media_type=media,
            headers={"Content-Disposition": f'inline; filename="{filename}"'},
        )
    # download
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="application/octet-stream",
    )

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
def download_quiz_answer(filename: str, mode: str = Query("download")):
    file_path = os.path.join(QUIZ_UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return serve_file(file_path, filename, mode)


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
def download_homework(filename: str, mode: str = Query("download")):
    # This specifically looks inside the 'uploads/homeworks' folder
    file_path = os.path.join(HOMEWORK_UPLOAD_DIR, filename)
    
    if not os.path.exists(file_path):
        # Fallback: check the base uploads folder
        fallback_path = os.path.join("uploads", filename)
        if os.path.exists(fallback_path):
            return serve_file(fallback_path, filename, mode)
        raise HTTPException(status_code=404, detail="Homework file not found")
        
    return serve_file(file_path, filename, mode)

# --- LIVE CLASSES ENDPOINTS (NEW) ---

@router.post("/live-classes")
def upload_live_class_attachment(file: UploadFile = File(...), user = Depends(get_current_user)):
    """Upload an attachment (PDF/image) for a past class"""
    path = save_file(file, LIVE_CLASSES_UPLOAD_DIR)
    # Returns /uploads/live_classes/filename.pdf
    return {"file_url": f"/{path}", "original_filename": file.filename}

@router.get("/live-classes/{filename}")
def download_live_class_attachment(filename: str, mode: str = Query("download")):
    # This specifically looks inside the 'uploads/live_classes' folder
    file_path = os.path.join(LIVE_CLASSES_UPLOAD_DIR, filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Attachment not found")
        
    return serve_file(file_path, filename, mode)

# --- PAYMENT PROOF ENDPOINTS ---

@router.post("/payments")
def upload_payment_proof(file: UploadFile = File(...), user = Depends(get_current_user)):
    path = save_file(file, PAYMENT_UPLOAD_DIR)
    return {"file_url": f"/{path}", "original_filename": file.filename}


@router.get("/payments/{filename}")
def download_payment_proof(filename: str, mode: str = Query("view")):
    file_path = os.path.join(PAYMENT_UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Payment proof not found")
    return serve_file(file_path, filename, mode)

# --- SOLUTIONS ENDPOINTS ---

@router.get("/solutions/{filename}")
def download_solution_file(filename: str, mode: str = Query("download")):
    """Download or view a solution file"""
    file_path = os.path.join(SOLUTIONS_UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Solution file not found")
    return serve_file(file_path, filename, mode)

# routers/uploads.py

@router.get("/{filename}")  # This catches /uploads/profile.jpeg
def get_root_upload(filename: str, mode: str = Query("download")):
    file_path = os.path.join("uploads", filename)
    if os.path.exists(file_path):
        return serve_file(file_path, filename, mode)
    
    # Also check homeworks folder as a fallback
    hw_path = os.path.join(HOMEWORK_UPLOAD_DIR, filename)
    if os.path.exists(hw_path):
        return serve_file(hw_path, filename, mode)
        
    raise HTTPException(status_code=404, detail="File not found")


# --- HOMEWORK IMAGES ---

@router.post("/homework_images")
def upload_homework_image(
    file: UploadFile = File(...),
    user = Depends(get_current_user)
):
    """Upload an image for a homework question"""
    # Validate file type
    allowed_types = {"image/jpeg", "image/png", "image/jpg"}
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only JPEG and PNG images are allowed")
    
    # Validate file size (max 10MB for images)
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    if file_size > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File size exceeds 10MB limit")
    
    path = save_file(file, HOMEWORK_IMAGES_DIR)
    return {"image_url": f"/{path}", "original_filename": file.filename}

@router.get("/homework_images/{filename}")
def download_homework_image(filename: str):
    file_path = os.path.join(HOMEWORK_IMAGES_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Image not found")
    
    # Return file with CORS headers explicitly set
    return FileResponse(
        filename=filename,
        headers={
            "Cross-Origin-Resource-Policy": "cross-origin",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        }
    )


# --- QUIZ IMAGES ---

@router.post("/quiz_images")
def upload_quiz_image(
    file: UploadFile = File(...),
    user = Depends(get_current_user)
):
    """Upload an image for a quiz question"""
    # Validate file type
    allowed_types = {"image/jpeg", "image/png", "image/jpg"}
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only JPEG and PNG images are allowed")
    
    # Validate file size (max 10MB for images)
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    if file_size > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File size exceeds 10MB limit")
    
    path = save_file(file, QUIZ_IMAGES_DIR)
    return {"image_url": f"/{path}", "original_filename": file.filename}

@router.get("/quiz_images/{filename}")
def download_quiz_image(filename: str):
    file_path = os.path.join(QUIZ_IMAGES_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Image not found")
    
    # Return file with CORS headers explicitly set
    return FileResponse(
        path=file_path,
        filename=filename,
        headers={
            "Cross-Origin-Resource-Policy": "cross-origin",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        }
    )