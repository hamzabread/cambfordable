"""added protection fields

Revision ID: 7745ceb41c80
Revises: 2151b940249a
Create Date: 2026-01-19 03:48:03.458347

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '7745ceb41c80'
down_revision: Union[str, Sequence[str], None] = '2151b940249a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # Add proctoring fields to quiz_submissions table
    op.add_column('quiz_submissions', 
        sa.Column('tab_switches', sa.Integer(), nullable=False, server_default='0')
    )
    op.add_column('quiz_submissions', 
        sa.Column('fullscreen_exits', sa.Integer(), nullable=False, server_default='0')
    )
    op.add_column('quiz_submissions', 
        sa.Column('auto_submitted', sa.Boolean(), nullable=False, server_default='false')
    )
    op.add_column('quiz_submissions', 
        sa.Column('flagged_for_review', sa.Boolean(), nullable=False, server_default='false')
    )


def downgrade():
    # Remove proctoring fields
    op.drop_column('quiz_submissions', 'flagged_for_review')
    op.drop_column('quiz_submissions', 'auto_submitted')
    op.drop_column('quiz_submissions', 'fullscreen_exits')
    op.drop_column('quiz_submissions', 'tab_switches')