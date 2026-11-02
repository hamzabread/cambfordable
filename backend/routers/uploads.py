from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from core.security import get_current_user
from crud.file_access import can_read_upload
from database import get_db
from models.users import User
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

UPLOAD_ROOT = "uploads"

# URL segment -> (directory, access rule name). "live-classes" is the older
# spelling of the attachment route.
UPLOAD_CATEGORIES = {
    "quiz_answers": (QUIZ_UPLOAD_DIR, "quiz_answers"),
    "homeworks": (HOMEWORK_UPLOAD_DIR, "homeworks"),
    "homework_images": (HOMEWORK_IMAGES_DIR, "homework_images"),
    "quiz_images": (QUIZ_IMAGES_DIR, "quiz_images"),
    "live_classes": (LIVE_CLASSES_UPLOAD_DIR, "live_classes"),
    "live-classes": (LIVE_CLASSES_UPLOAD_DIR, "live_classes"),
    "solutions": (SOLUTIONS_UPLOAD_DIR, "solutions"),
    "payments": (PAYMENT_UPLOAD_DIR, "payments"),
}

# Anything else is downloaded rather than rendered, so an uploaded HTML or SVG
# file can never run as a page.
INLINE_MEDIA_TYPES = {
    "application/pdf",
    "image/gif",
    "image/jpeg",
    "image/png",
    "image/webp",
    "text/plain",
}


def _guess_media_type(filename: str) -> str:
    """Return a browser-friendly MIME type for common file extensions."""
    mt, _ = mimetypes.guess_type(filename)
    return mt or "application/octet-stream"


def serve_file(file_path: str, filename: str, mode: str = "download") -> FileResponse:
    """
    Return a FileResponse.
    mode="view"   → Content-Disposition: inline for types that are safe to render
    otherwise     → Content-Disposition: attachment (browser downloads)
    """
    media_type = _guess_media_type(filename)
    inline = mode == "view" and media_type in INLINE_MEDIA_TYPES
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type=media_type if inline else "application/octet-stream",
        content_disposition_type="inline" if inline else "attachment",
        headers={"X-Content-Type-Options": "nosniff"},
    )


def _is_safe_filename(filename: str) -> bool:
    """A stored upload name is one path segment, on every operating system."""
    return bool(filename) and filename not in {".", ".."} and not any(
        char in filename for char in ("/", "\\", ":", "\0")
    )


def _resolve_upload_path(directory: str, filename: str) -> str | None:
    """Return the file's path if it is a real file directly inside directory."""
    base = os.path.realpath(directory)
    path = os.path.realpath(os.path.join(base, filename))
    if os.path.dirname(path) != base or not os.path.isfile(path):
        return None
    return path


MB = 1024 * 1024
IMAGE_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}
DOCUMENT_EXTENSIONS = {"pdf", "doc", "docx"} | IMAGE_EXTENSIONS
ATTACHMENT_EXTENSIONS = DOCUMENT_EXTENSIONS | {"ppt", "pptx", "xls", "xlsx", "txt", "zip"}


def _extension(filename: str | None) -> str:
    return filename.rsplit(".", 1)[-1].lower() if filename and "." in filename else ""


def validate_upload(file: UploadFile, allowed_extensions: set[str], max_bytes: int) -> None:
    """Reject files by extension and size before they reach the disk."""
    extension = _extension(file.filename)
    if extension not in allowed_extensions:
        allowed = ", ".join(sorted(ext.upper() for ext in allowed_extensions))
        raise HTTPException(status_code=400, detail=f"This file type isn't allowed. Upload one of: {allowed}")
    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)
    if size == 0:
        raise HTTPException(status_code=400, detail="The file is empty")
    if size > max_bytes:
        raise HTTPException(status_code=413, detail=f"The file must be {max_bytes // MB} MB or smaller")


# --- HELPER FUNCTION FOR FILE SAVING ---
def save_file(file: UploadFile, destination_dir: str, prefix: str = "") -> str:
    original_name = file.filename
    ext = original_name.split(".")[-1] if "." in original_name else ""
    name_without_ext = original_name.rsplit(".", 1)[0] if "." in original_name else original_name
    
    unique_id = str(uuid.uuid4())[:8]
    filename = f"{prefix}{name_without_ext}_{unique_id}.{ext}" if ext else f"{prefix}{name_without_ext}_{unique_id}"
    
    # Simple sanitization
    filename = "".join(c for c in filename if c.isalnum() or c in "._- ")
    # Stored as a URL path, so always forward slashes.
    path = f"{destination_dir}/{filename}"

    with open(path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return path


def quiz_answer_prefix(user_id: int) -> str:
    """Quiz answer files carry their uploader, so a submission can only
    point at the student's own uploads."""
    return f"u{user_id}_"


@router.post("/quiz-answer")
def upload_quiz_answer_file(
    file: UploadFile = File(...),
    quiz_id: int | None = Query(None),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if quiz_id is not None:
        from routers.quizzes import _require_quiz_access
        _require_quiz_access(db, user, quiz_id)
    validate_upload(file, DOCUMENT_EXTENSIONS, 10 * MB)
    path = save_file(file, QUIZ_UPLOAD_DIR, prefix=quiz_answer_prefix(user.id))
    return {"file_url": f"/{path}", "original_filename": file.filename}


# --- READING FILES ---
# Every read requires a login and a per-file permission check.

@router.get("/{category}/{filename}")
def read_upload(
    category: str,
    filename: str,
    mode: str = Query("download"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if category not in UPLOAD_CATEGORIES or not _is_safe_filename(filename):
        raise HTTPException(status_code=404, detail="File not found")

    directory, access_rule = UPLOAD_CATEGORIES[category]
    if not can_read_upload(db, user, access_rule, filename):
        raise HTTPException(status_code=403, detail="You do not have access to this file")

    path = _resolve_upload_path(directory, filename)
    # Older homework files were saved directly under uploads/.
    if not path and access_rule == "homeworks":
        path = _resolve_upload_path(UPLOAD_ROOT, filename)
    if not path:
        raise HTTPException(status_code=404, detail="File not found")
    return serve_file(path, filename, mode)


@router.get("/{filename}")
def read_legacy_upload(
    filename: str,
    mode: str = Query("download"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Older homework submissions are stored as /uploads/<filename>."""
    if not _is_safe_filename(filename):
        raise HTTPException(status_code=404, detail="File not found")
    if not can_read_upload(db, user, "homeworks", filename):
        raise HTTPException(status_code=403, detail="You do not have access to this file")

    path = _resolve_upload_path(UPLOAD_ROOT, filename) or _resolve_upload_path(HOMEWORK_UPLOAD_DIR, filename)
    if not path:
        raise HTTPException(status_code=404, detail="File not found")
    return serve_file(path, filename, mode)
