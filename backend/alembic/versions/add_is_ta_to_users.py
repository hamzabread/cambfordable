"""Add is_ta to users

Revision ID: add_is_ta_to_users
Revises: add_remarks_to_quiz_submissions
Create Date: 2026-03-01

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_is_ta_to_users'
down_revision = 'add_remarks_to_quiz_submissions'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add is_ta column to users
    op.add_column('users', sa.Column('is_ta', sa.Boolean(), nullable=False, server_default='false'))


def downgrade() -> None:
    # Remove is_ta column from users
    op.drop_column('users', 'is_ta')
