"""add payment proof to enrollments

Revision ID: 5f8b2d4c1a7e
Revises: 3a9fbf6e5c21
Create Date: 2026-06-01 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "5f8b2d4c1a7e"
down_revision = "3a9fbf6e5c21"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "enrollments",
        sa.Column("payment_proof_url", sa.String(), nullable=True),
    )
    op.add_column(
        "enrollments",
        sa.Column("payment_proof_name", sa.String(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("enrollments", "payment_proof_name")
    op.drop_column("enrollments", "payment_proof_url")