"""Course questions: short threads between a student and the course's teachers,
for questions outside live class time. A thread is visible to the student who
started it and to the course staff (admins, and TAs on the course)."""
from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from core.rate_limit import SlidingWindowLimiter
from core.security import get_current_admin, get_current_user
from crud.notifications import create_notification, notify_course_staff
from database import get_db
from models.course_threads import CourseThread, ThreadReply
from models.courses import Course
from models.enrollments import Enrollment
from models.users import User
from schemas.courses import CourseOut
from schemas.threads import ReplyCreate, ReplyOut, ThreadCreate, ThreadDetail, ThreadSummary, ThreadUpdate

router = APIRouter(prefix="/threads", tags=["Course questions"])

post_limit = SlidingWindowLimiter(
    limit=20,
    window_seconds=10 * 60,
    message="You're posting very quickly. Please wait a few minutes and try again.",
)


def _is_staff(user: User) -> bool:
    return bool(user.is_admin or user.is_ta)


def _staff_course_ids(db: Session, user: User) -> list[int] | None:
    """None means every course (admins)."""
    if user.is_admin:
        return None
    if user.is_ta:
        return [row[0] for row in db.query(Enrollment.course_id).filter(Enrollment.user_id == user.id)]
    return []


def _student_can_ask(db: Session, user: User, course_id: int) -> bool:
    return db.query(Enrollment).join(Course, Course.id == Enrollment.course_id).filter(
        Enrollment.user_id == user.id,
        Enrollment.course_id == course_id,
        Enrollment.paid.is_(True),
        Course.archived_at.is_(None),
    ).first() is not None


def _can_staff(db: Session, user: User, course_id: int) -> bool:
    course_ids = _staff_course_ids(db, user)
    return course_ids is None or course_id in course_ids


def _thread_for(db: Session, thread_id: int, user: User) -> CourseThread:
    thread = (
        db.query(CourseThread)
        .options(joinedload(CourseThread.replies).joinedload(ThreadReply.author), joinedload(CourseThread.author))
        .filter(CourseThread.id == thread_id)
        .first()
    )
    if not thread or not (thread.author_id == user.id or (_is_staff(user) and _can_staff(db, user, thread.course_id))):
        raise HTTPException(status_code=404, detail="Question not found")
    return thread


def _name(user: User | None) -> str:
    return (user.full_name or user.username) if user else "Deleted user"


def _summary(thread: CourseThread, course_name: str) -> dict:
    replies = thread.replies
    last = replies[-1] if replies else None
    preview = " ".join((last.body if last else "").split())
    return dict(
        id=thread.id,
        course_id=thread.course_id,
        course_name=course_name,
        title=thread.title,
        author_id=thread.author_id,
        author_name=_name(thread.author),
        is_resolved=thread.is_resolved,
        reply_count=max(0, len(replies) - 1),
        awaiting_staff=not thread.is_resolved and bool(last) and not last.is_staff,
        last_reply_preview=preview[:140],
        created_at=thread.created_at,
        updated_at=thread.updated_at,
    )


def _detail(db: Session, thread: CourseThread, user: User) -> ThreadDetail:
    course = db.query(Course).filter(Course.id == thread.course_id).first()
    can_reply = (
        (_is_staff(user) and _can_staff(db, user, thread.course_id))
        or (thread.author_id == user.id and _student_can_ask(db, user, thread.course_id))
    )
    return ThreadDetail(
        **_summary(thread, course.name if course else ""),
        replies=[
            ReplyOut(
                id=reply.id,
                author_id=reply.author_id,
                author_name=_name(reply.author),
                is_staff=reply.is_staff,
                is_mine=reply.author_id == user.id,
                body=reply.body,
                created_at=reply.created_at,
            )
            for reply in thread.replies
        ],
        can_reply=can_reply,
    )


@router.get("/courses", response_model=list[CourseOut])
def courses_to_ask_in(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """The courses this student can post a question in."""
    return (
        db.query(Course)
        .join(Enrollment, Enrollment.course_id == Course.id)
        .filter(
            Enrollment.user_id == current_user.id,
            Enrollment.paid.is_(True),
            Course.archived_at.is_(None),
        )
        .order_by(Course.name)
        .all()
    )


@router.get("", response_model=list[ThreadSummary])
def list_threads(
    course_id: int | None = None,
    status: Literal["open", "resolved", "all"] = "all",
    limit: int = Query(default=100, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(CourseThread).options(
        joinedload(CourseThread.replies), joinedload(CourseThread.author)
    )
    if _is_staff(current_user):
        course_ids = _staff_course_ids(db, current_user)
        if course_ids is not None:
            query = query.filter(CourseThread.course_id.in_(course_ids or [-1]))
    else:
        query = query.filter(CourseThread.author_id == current_user.id)
    if course_id is not None:
        query = query.filter(CourseThread.course_id == course_id)
    if status == "open":
        query = query.filter(CourseThread.is_resolved.is_(False))
    elif status == "resolved":
        query = query.filter(CourseThread.is_resolved.is_(True))
    threads = query.order_by(CourseThread.updated_at.desc()).limit(limit).all()
    names = dict(db.query(Course.id, Course.name).filter(Course.id.in_({t.course_id for t in threads} or {-1})))
    return [ThreadSummary(**_summary(thread, names.get(thread.course_id, ""))) for thread in threads]


@router.post("", response_model=ThreadDetail, status_code=201)
def create_thread(
    payload: ThreadCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if _is_staff(current_user):
        raise HTTPException(status_code=403, detail="Questions are started by students. Reply to one instead.")
    if not _student_can_ask(db, current_user, payload.course_id):
        raise HTTPException(status_code=403, detail="You can ask questions in courses you're enrolled in")
    post_limit.check(f"user:{current_user.id}")
    post_limit.hit(f"user:{current_user.id}")

    now = datetime.now(timezone.utc)
    thread = CourseThread(
        course_id=payload.course_id,
        author_id=current_user.id,
        title=payload.title,
        created_at=now,
        updated_at=now,
    )
    thread.replies.append(ThreadReply(author_id=current_user.id, body=payload.body, is_staff=False, created_at=now))
    db.add(thread)
    db.commit()

    course = db.query(Course).filter(Course.id == payload.course_id).first()
    notify_course_staff(
        db,
        course_id=payload.course_id,
        kind="question",
        title="New course question",
        message=f"{_name(current_user)} asked in {course.name if course else 'a course'}: {payload.title}",
        href=f"/messages?thread={thread.id}",
    )
    return _detail(db, _thread_for(db, thread.id, current_user), current_user)


@router.get("/{thread_id}", response_model=ThreadDetail)
def get_thread(
    thread_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _detail(db, _thread_for(db, thread_id, current_user), current_user)


@router.post("/{thread_id}/replies", response_model=ThreadDetail, status_code=201)
def reply_to_thread(
    thread_id: int,
    payload: ReplyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    thread = _thread_for(db, thread_id, current_user)
    staff = _is_staff(current_user) and _can_staff(db, current_user, thread.course_id)
    if not staff and not _student_can_ask(db, current_user, thread.course_id):
        raise HTTPException(status_code=403, detail="Your access to this course has ended, so you can't reply")
    post_limit.check(f"user:{current_user.id}")
    post_limit.hit(f"user:{current_user.id}")

    now = datetime.now(timezone.utc)
    thread.replies.append(ThreadReply(author_id=current_user.id, body=payload.body, is_staff=staff, created_at=now))
    thread.updated_at = now
    if not staff:
        # A follow-up from the student reopens the question.
        thread.is_resolved = False
    db.commit()

    href = f"/messages?thread={thread.id}"
    if staff:
        if thread.author_id != current_user.id:
            create_notification(
                db,
                user_id=thread.author_id,
                kind="question",
                title="Your question was answered",
                message=f"{_name(current_user)} replied to “{thread.title}”.",
                href=href,
            )
    else:
        notify_course_staff(
            db,
            course_id=thread.course_id,
            kind="question",
            title="Follow-up on a question",
            message=f"{_name(current_user)} replied to “{thread.title}”.",
            href=href,
        )
    return _detail(db, _thread_for(db, thread.id, current_user), current_user)


@router.patch("/{thread_id}", response_model=ThreadDetail)
def update_thread(
    thread_id: int,
    payload: ThreadUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark a question answered, or reopen it. The student or the staff can."""
    thread = _thread_for(db, thread_id, current_user)
    thread.is_resolved = payload.is_resolved
    db.commit()
    return _detail(db, _thread_for(db, thread.id, current_user), current_user)


@router.delete("/{thread_id}", status_code=204)
def delete_thread(
    thread_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    thread = db.query(CourseThread).filter(CourseThread.id == thread_id).first()
    if not thread:
        raise HTTPException(status_code=404, detail="Question not found")
    db.delete(thread)
    db.commit()

