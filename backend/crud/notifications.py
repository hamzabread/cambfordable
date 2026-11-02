from sqlalchemy.orm import Session

from models.enrollments import Enrollment
from models.notifications import Notification
from models.users import User


def create_notification(
    db: Session,
    *,
    user_id: int,
    kind: str,
    title: str,
    message: str,
    href: str | None = None,
    commit: bool = True,
) -> Notification:
    notification = Notification(
        user_id=user_id,
        kind=kind,
        title=title,
        message=message,
        href=href,
    )
    db.add(notification)
    if commit:
        db.commit()
        db.refresh(notification)
    return notification


def notify_admins(
    db: Session,
    *,
    kind: str,
    title: str,
    message: str,
    href: str | None = None,
) -> int:
    """Notify every admin — used for items awaiting admin action."""
    admin_ids = [row[0] for row in db.query(User.id).filter(User.is_admin.is_(True)).all()]
    if not admin_ids:
        return 0

    db.add_all(
        [
            Notification(
                user_id=admin_id,
                kind=kind,
                title=title,
                message=message,
                href=href,
            )
            for admin_id in admin_ids
        ]
    )
    db.commit()
    return len(admin_ids)


def notify_course_students(
    db: Session,
    *,
    course_id: int,
    kind: str,
    title: str,
    message: str,
    href: str,
) -> int:
    user_ids = [
        row[0]
        for row in db.query(Enrollment.user_id)
        .filter(
            Enrollment.course_id == course_id,
            Enrollment.paid.is_(True),
        )
        .distinct()
        .all()
    ]
    if not user_ids:
        return 0

    db.add_all(
        [
            Notification(
                user_id=user_id,
                kind=kind,
                title=title,
                message=message,
                href=href,
            )
            for user_id in user_ids
        ]
    )
    db.commit()
    return len(user_ids)


def notify_grade_update(
    db: Session,
    *,
    user_id: int,
    item_kind: str,
    item_title: str,
    old_score,
    new_score,
    old_remark: str | None,
    new_remark: str | None,
) -> None:
    """Tell the student once per real change: a new or changed score is
    "graded"; a remark alone is "feedback". Saving the same grade again
    sends nothing."""
    if new_score is not None and new_score != old_score:
        create_notification(
            db,
            user_id=user_id,
            kind="grade",
            title=f"{item_kind} graded",
            message=f"Your submission for {item_title} has been graded.",
            href="/results",
        )
    elif new_remark and new_remark != old_remark:
        create_notification(
            db,
            user_id=user_id,
            kind="grade",
            title="New feedback",
            message=f"Your teacher left feedback on {item_title}.",
            href="/results" if new_score is not None else "/homework?tab=submitted",
        )


def course_staff_ids(db: Session, course_id: int) -> list[int]:
    """Admins, plus the TAs enrolled in this course."""
    admin_ids = [row[0] for row in db.query(User.id).filter(User.is_admin.is_(True))]
    ta_ids = [
        row[0]
        for row in db.query(User.id)
        .join(Enrollment, Enrollment.user_id == User.id)
        .filter(Enrollment.course_id == course_id, User.is_ta.is_(True))
    ]
    return list(dict.fromkeys(admin_ids + ta_ids))


def notify_course_staff(
    db: Session,
    *,
    course_id: int,
    kind: str,
    title: str,
    message: str,
    href: str | None = None,
    exclude_user_id: int | None = None,
) -> int:
    staff_ids = [user_id for user_id in course_staff_ids(db, course_id) if user_id != exclude_user_id]
    db.add_all(
        [Notification(user_id=user_id, kind=kind, title=title, message=message, href=href) for user_id in staff_ids]
    )
    db.commit()
    return len(staff_ids)
