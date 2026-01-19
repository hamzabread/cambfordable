"""add quiz deadline and late submission

Revision ID: 40b12243dadf
Revises: 616a4eb7085f
Create Date: 2026-01-17 22:56:26.425561

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '40b12243dadf'
down_revision: Union[str, Sequence[str], None] = '616a4eb7085f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.add_column(
        "quizzes",
        sa.Column("deadline", sa.TIMESTAMP(timezone=True), nullable=True),
    )
    op.add_column(
        "quizzes",
        sa.Column("allow_late", sa.Boolean(), nullable=False, server_default="false"),
    )
    op.add_column(
        "quiz_submissions",
        sa.Column("submitted_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=True),
    )
    op.add_column(
        "quiz_submissions",
        sa.Column("is_late", sa.Boolean(), nullable=False, server_default="false"),
    )

def downgrade():
    op.drop_column("quiz_submissions", "is_late")
    op.drop_column("quiz_submissions", "submitted_at")
    op.drop_column("quizzes", "allow_late")
    op.drop_column("quizzes", "deadline")
