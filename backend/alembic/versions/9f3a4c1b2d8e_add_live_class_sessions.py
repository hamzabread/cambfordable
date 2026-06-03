"""add live class sessions

Revision ID: 9f3a4c1b2d8e
Revises: 74eea57744e4
Create Date: 2026-05-30 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "9f3a4c1b2d8e"
down_revision = "74eea57744e4"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "live_class_sessions",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("live_class_id", sa.Integer(), nullable=False),
        sa.Column("device_id", sa.String(), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_seen", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.ForeignKeyConstraint(["user_id"], ["public.users.id"], ondelete=None),
        sa.ForeignKeyConstraint(["live_class_id"], ["public.live_classes.id"], ondelete=None),
    )
    op.create_index("ix_live_class_sessions_user_active", "live_class_sessions", ["user_id", "is_active"], unique=False)
    op.create_index("ix_live_class_sessions_device", "live_class_sessions", ["device_id"], unique=False)
    op.create_index("ix_live_class_sessions_live_class_id", "live_class_sessions", ["live_class_id"], unique=False)
    op.create_index("ix_live_class_sessions_last_seen", "live_class_sessions", ["last_seen"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_live_class_sessions_last_seen", table_name="live_class_sessions")
    op.drop_index("ix_live_class_sessions_live_class_id", table_name="live_class_sessions")
    op.drop_index("ix_live_class_sessions_device", table_name="live_class_sessions")
    op.drop_index("ix_live_class_sessions_user_active", table_name="live_class_sessions")
    op.drop_table("live_class_sessions")
