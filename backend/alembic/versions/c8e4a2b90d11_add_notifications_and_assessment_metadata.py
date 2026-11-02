"""add notifications and assessment metadata

Revision ID: c8e4a2b90d11
Revises: 7b6d1c2e9a40
Create Date: 2026-08-02 00:00:00.000000
"""

from alembic import context, op
import sqlalchemy as sa


revision = "c8e4a2b90d11"
down_revision = "7b6d1c2e9a40"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Older app versions called Base.metadata.create_all() during startup. That
    # can pre-create new tables without advancing Alembic, so this migration
    # reconciles that known state while still rejecting an unrelated table with
    # the same name.
    inspector = None if context.is_offline_mode() else sa.inspect(op.get_bind())
    tables = set() if inspector is None else set(inspector.get_table_names())

    def column_names(table_name: str) -> set[str]:
        if inspector is None or table_name not in tables:
            return set()
        return {column["name"] for column in inspector.get_columns(table_name)}

    if "duration_minutes" not in column_names("quizzes"):
        op.add_column(
            "quizzes",
            sa.Column("duration_minutes", sa.Integer(), nullable=False, server_default="60"),
        )
    if "max_score" not in column_names("homeworks"):
        op.add_column(
            "homeworks",
            sa.Column("max_score", sa.Float(), nullable=False, server_default="100"),
        )
    if "graded_at" not in column_names("quiz_submissions"):
        op.add_column("quiz_submissions", sa.Column("graded_at", sa.DateTime(timezone=True), nullable=True))
    if "graded_at" not in column_names("homework_submissions"):
        op.add_column("homework_submissions", sa.Column("graded_at", sa.DateTime(timezone=True), nullable=True))

    notification_columns = {
        "id", "user_id", "kind", "title", "message", "href", "is_read", "created_at"
    }
    if "notifications" not in tables:
        op.create_table(
            "notifications",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("kind", sa.String(length=40), nullable=False),
            sa.Column("title", sa.String(length=160), nullable=False),
            sa.Column("message", sa.Text(), nullable=False),
            sa.Column("href", sa.String(length=255), nullable=True),
            sa.Column("is_read", sa.Boolean(), nullable=False, server_default=sa.false()),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )
        existing_indexes: set[str] = set()
    else:
        existing_columns = column_names("notifications")
        if existing_columns != notification_columns:
            raise RuntimeError(
                "Existing notifications table does not match the application schema; "
                f"found columns {sorted(existing_columns)}"
            )
        existing_indexes = {index["name"] for index in inspector.get_indexes("notifications")}

    for index_name, column_name in (
        ("ix_notifications_id", "id"),
        ("ix_notifications_user_id", "user_id"),
        ("ix_notifications_is_read", "is_read"),
        ("ix_notifications_created_at", "created_at"),
    ):
        if index_name not in existing_indexes:
            op.create_index(index_name, "notifications", [column_name])


def downgrade() -> None:
    op.drop_index("ix_notifications_created_at", table_name="notifications")
    op.drop_index("ix_notifications_is_read", table_name="notifications")
    op.drop_index("ix_notifications_user_id", table_name="notifications")
    op.drop_index("ix_notifications_id", table_name="notifications")
    op.drop_table("notifications")
    op.drop_column("homework_submissions", "graded_at")
    op.drop_column("quiz_submissions", "graded_at")
    op.drop_column("homeworks", "max_score")
    op.drop_column("quizzes", "duration_minutes")
