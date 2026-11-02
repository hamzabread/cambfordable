"""add student profile fields

Revision ID: 7b6d1c2e9a40
Revises: 5f8b2d4c1a7e
Create Date: 2026-08-01 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "7b6d1c2e9a40"
down_revision = "5f8b2d4c1a7e"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("date_of_birth", sa.Date(), nullable=True))
    op.add_column("users", sa.Column("gender", sa.String(), nullable=True))
    op.add_column("users", sa.Column("nationality", sa.String(), nullable=True))
    op.add_column("users", sa.Column("permanent_address", sa.Text(), nullable=True))
    op.add_column("users", sa.Column("student_id", sa.String(), nullable=True))
    op.add_column("users", sa.Column("major", sa.String(), nullable=True))
    op.add_column("users", sa.Column("current_year", sa.String(), nullable=True))
    op.add_column("users", sa.Column("academic_standing", sa.String(), nullable=True))
    op.add_column(
        "users",
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )
    op.create_index("ix_users_student_id", "users", ["student_id"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_users_student_id", table_name="users")
    op.drop_column("users", "created_at")
    op.drop_column("users", "academic_standing")
    op.drop_column("users", "current_year")
    op.drop_column("users", "major")
    op.drop_column("users", "student_id")
    op.drop_column("users", "permanent_address")
    op.drop_column("users", "nationality")
    op.drop_column("users", "gender")
    op.drop_column("users", "date_of_birth")
