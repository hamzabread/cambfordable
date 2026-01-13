"""add_meeting_password_to_live_classes

Revision ID: 616a4eb7085f
Revises: 6196dcdcb0ce
Create Date: 2026-01-13 06:34:48.218519

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '616a4eb7085f'
down_revision: Union[str, Sequence[str], None] = '6196dcdcb0ce'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('live_classes', sa.Column('meeting_password', sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('live_classes', 'meeting_password')
