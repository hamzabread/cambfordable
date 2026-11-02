"""zoom recordings and attendance, course question threads, course archive

Revision ID: a7d2e9f4c613
Revises: f3c8a1d52e67
Create Date: 2026-11-03 00:00:00.000000
"""

from alembic import context, op
import sqlalchemy as sa


revision = "a7d2e9f4c613"
down_revision = "f3c8a1d52e67"
branch_labels = None
depends_on = None


def upgrade() -> None:
    inspector = None if context.is_offline_mode() else sa.inspect(op.get_bind())
    tables = set() if inspector is None else set(inspector.get_table_names())

    def columns(table: str) -> set[str]:
        if inspector is None or table not in tables:
            return set()
        return {c["name"] for c in inspector.get_columns(table)}

    if "archived_at" not in columns("courses"):
        op.add_column("courses", sa.Column("archived_at", sa.DateTime(timezone=True), nullable=True))

    live_class_columns = columns("live_classes")
    for name, column in [
        ("recording_url", sa.Column("recording_url", sa.String(), nullable=True)),
        ("recording_passcode", sa.Column("recording_passcode", sa.String(), nullable=True)),
        ("recording_synced_at", sa.Column("recording_synced_at", sa.DateTime(timezone=True), nullable=True)),
        ("attendance_synced_at", sa.Column("attendance_synced_at", sa.DateTime(timezone=True), nullable=True)),
    ]:
        if name not in live_class_columns:
            op.add_column("live_classes", column)

    if "class_attendance" not in tables:
        op.create_table(
            "class_attendance",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("live_class_id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=True),
            sa.Column("display_name", sa.String(), nullable=False),
            sa.Column("minutes", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("first_join", sa.DateTime(timezone=True), nullable=True),
            sa.Column("last_leave", sa.DateTime(timezone=True), nullable=True),
            sa.Column("source", sa.String(length=10), nullable=False, server_default="zoom"),
            sa.Column("recorded_at", sa.DateTime(timezone=True), nullable=False),
            sa.ForeignKeyConstraint(["live_class_id"], ["live_classes.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_class_attendance_id", "class_attendance", ["id"])
        op.create_index("ix_class_attendance_live_class_id", "class_attendance", ["live_class_id"])
        op.create_index("ix_class_attendance_user_id", "class_attendance", ["user_id"])

    if "course_threads" not in tables:
        op.create_table(
            "course_threads",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("course_id", sa.Integer(), nullable=False),
            sa.Column("author_id", sa.Integer(), nullable=False),
            sa.Column("title", sa.String(length=150), nullable=False),
            sa.Column("is_resolved", sa.Boolean(), nullable=False, server_default=sa.false()),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
            sa.ForeignKeyConstraint(["course_id"], ["courses.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["author_id"], ["users.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_course_threads_id", "course_threads", ["id"])
        op.create_index("ix_course_threads_course_id", "course_threads", ["course_id"])
        op.create_index("ix_course_threads_author_id", "course_threads", ["author_id"])
        op.create_index("ix_course_threads_updated_at", "course_threads", ["updated_at"])

    if "thread_replies" not in tables:
        op.create_table(
            "thread_replies",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("thread_id", sa.Integer(), nullable=False),
            sa.Column("author_id", sa.Integer(), nullable=False),
            sa.Column("body", sa.Text(), nullable=False),
            sa.Column("is_staff", sa.Boolean(), nullable=False, server_default=sa.false()),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.ForeignKeyConstraint(["thread_id"], ["course_threads.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["author_id"], ["users.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_thread_replies_id", "thread_replies", ["id"])
        op.create_index("ix_thread_replies_thread_id", "thread_replies", ["thread_id"])
        op.create_index("ix_thread_replies_author_id", "thread_replies", ["author_id"])


def downgrade() -> None:
    op.drop_table("thread_replies")
    op.drop_table("course_threads")
    op.drop_table("class_attendance")
    for name in ["attendance_synced_at", "recording_synced_at", "recording_passcode", "recording_url"]:
        op.drop_column("live_classes", name)
    op.drop_column("courses", "archived_at")
