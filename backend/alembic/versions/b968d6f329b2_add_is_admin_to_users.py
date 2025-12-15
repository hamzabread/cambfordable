"""add is_admin to users

Revision ID: b968d6f329b2
Revises: 17d891e459e3
Create Date: 2025-12-15 20:54:54.827945
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'b968d6f329b2'
down_revision: Union[str, Sequence[str], None] = '17d891e459e3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Column already added manually
    pass


def downgrade() -> None:
    op.drop_column('users', 'is_admin')
