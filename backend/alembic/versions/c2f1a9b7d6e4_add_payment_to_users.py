"""add payment to users

Revision ID: c2f1a9b7d6e4
Revises: 9f3a4c1b2d8e
Create Date: 2026-05-30 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "c2f1a9b7d6e4"
down_revision = "9f3a4c1b2d8e"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("payment", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.alter_column("users", "payment", server_default=None)


def downgrade() -> None:
    op.drop_column("users", "payment")
