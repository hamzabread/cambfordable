"""add original file name

Revision ID: 2151b940249a
Revises: 40b12243dadf
Create Date: 2026-01-18 21:51:35.973683

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '2151b940249a'
down_revision: Union[str, Sequence[str], None] = '40b12243dadf'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # Add original_filename column to quiz_answers table
    op.add_column('quiz_answers', 
        sa.Column('original_filename', sa.String(), nullable=True)
    )


def downgrade():
    # Remove original_filename column
    op.drop_column('quiz_answers', 'original_filename')
