"""add_remark_to_homework

Revision ID: fb0f42fcea46
Revises: 4d1e78023d14
Create Date: 2026-01-19 05:08:02.346235

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fb0f42fcea46'
# CHANGE THIS LINE BELOW:
down_revision: Union[str, Sequence[str], None] = '7745ceb41c80' 
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Adding columns safely without dropping tables
    op.add_column('homework_submissions', sa.Column('remark', sa.String(), nullable=True))
    op.add_column('homework_submissions', sa.Column('score', sa.Float(), nullable=True))

def downgrade() -> None:
    op.drop_column('homework_submissions', 'score')
    op.drop_column('homework_submissions', 'remark')
