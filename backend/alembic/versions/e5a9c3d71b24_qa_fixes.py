"""chat sender role, session invalidation, payment review and quiz attempts

Revision ID: e5a9c3d71b24
Revises: c8e4a2b90d11
Create Date: 2026-11-02 00:00:00.000000
"""

from alembic import context, op
import sqlalchemy as sa


revision = "e5a9c3d71b24"
down_revision = "c8e4a2b90d11"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Some of these columns were created on the production database outside
    # Alembic (enrollments.paid_at), so each step checks what already exists.
    inspector = None if context.is_offline_mode() else sa.inspect(op.get_bind())
    tables = set() if inspector is None else set(inspector.get_table_names())

    def column_names(table_name: str) -> set[str]:
        if inspector is None or table_name not in tables:
            return set()
        return {column["name"] for column in inspector.get_columns(table_name)}

    if "is_admin" not in column_names("live_class_messages"):
        op.add_column(
            "live_class_messages",
            sa.Column("is_admin", sa.Boolean(), nullable=False, server_default=sa.false()),
        )
        # Messages sent before this column existed keep their instructor flag.
        op.execute(
            "UPDATE live_class_messages SET is_admin = TRUE "
            "WHERE user_id IN (SELECT id FROM users WHERE is_admin = TRUE)"
        )

    if "password_changed_at" not in column_names("users"):
        op.add_column("users", sa.Column("password_changed_at", sa.DateTime(timezone=True), nullable=True))

    enrollment_columns = column_names("enrollments")
    if "paid_at" not in enrollment_columns:
        op.add_column("enrollments", sa.Column("paid_at", sa.DateTime(), nullable=True))
    if "payment_rejection_reason" not in enrollment_columns:
        op.add_column("enrollments", sa.Column("payment_rejection_reason", sa.Text(), nullable=True))

    if "quiz_attempts" not in tables:
        op.create_table(
            "quiz_attempts",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("quiz_id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
            sa.ForeignKeyConstraint(["quiz_id"], ["quizzes.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("quiz_id", "user_id", name="unique_quiz_attempt"),
        )
        op.create_index("ix_quiz_attempts_id", "quiz_attempts", ["id"])


def downgrade() -> None:
    op.drop_index("ix_quiz_attempts_id", table_name="quiz_attempts")
    op.drop_table("quiz_attempts")
    op.drop_column("enrollments", "payment_rejection_reason")
    op.drop_column("users", "password_changed_at")
    op.drop_column("live_class_messages", "is_admin")
