"""merge heads payment and ta

Revision ID: 1c7f9d8e6b3a
Revises: add_is_ta_to_users, c2f1a9b7d6e4
Create Date: 2026-05-30 00:00:00.000000
"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "1c7f9d8e6b3a"
down_revision = ("add_is_ta_to_users", "c2f1a9b7d6e4")
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Merge revision; no schema changes.
    pass


def downgrade() -> None:
    # Merge revision; no schema changes.
    pass
