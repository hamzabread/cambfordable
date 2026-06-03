"""add paid to enrollments

Revision ID: 3a9fbf6e5c21
Revises: 1c7f9d8e6b3a
Create Date: 2026-05-30 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "3a9fbf6e5c21"
down_revision = "1c7f9d8e6b3a"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "enrollments",
        sa.Column("paid", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.alter_column("enrollments", "paid", server_default=None)


def downgrade() -> None:
    op.drop_column("enrollments", "paid")
