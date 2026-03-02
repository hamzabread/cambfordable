"""Add remarks to quiz_submissions

Revision ID: add_remarks_to_quiz_submissions
Revises: add_attachment_url_live_classes
Create Date: 2026-03-01

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_remarks_to_quiz_submissions'
down_revision = 'add_attachment_url_live_classes'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add remarks column to quiz_submissions
    op.add_column('quiz_submissions', sa.Column('remarks', sa.String(), nullable=True))


def downgrade() -> None:
    # Remove remarks column from quiz_submissions
    op.drop_column('quiz_submissions', 'remarks')
