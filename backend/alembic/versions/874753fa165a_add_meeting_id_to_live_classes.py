"""add meeting_id to live_classes

Revision ID: 874753fa165a
Revises: 74eea57744e4
Create Date: 2026-01-09 16:21:52.195063

"""
from alembic import op
import sqlalchemy as sa


revision = "874753fa165a"
down_revision = "74eea57744e4"
branch_labels = None
depends_on = None


def upgrade():
    # 1️⃣ add column as nullable
    op.add_column(
        "live_classes",
        sa.Column("meeting_id", sa.String(), nullable=True),
    )

    # 2️⃣ backfill existing rows
    op.execute(
        """
        UPDATE live_classes
        SET meeting_id = 'TEMP_MEETING_ID'
        WHERE meeting_id IS NULL
        """
    )

    # 3️⃣ enforce NOT NULL
    op.alter_column(
        "live_classes",
        "meeting_id",
        nullable=False,
    )


def downgrade():
    op.drop_column("live_classes", "meeting_id")

