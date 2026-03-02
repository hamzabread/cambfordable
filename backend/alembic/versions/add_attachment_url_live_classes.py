"""add attachment_url to live_classes

Revision ID: add_attachment_url_live_classes
Revises: fb0f42fcea46
Create Date: 2026-02-28 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = "add_attachment_url_live_classes"
down_revision = "fb0f42fcea46"
branch_labels = None
depends_on = None


def upgrade():
    # Add attachment_url column as nullable (for backward compatibility)
    op.add_column(
        "live_classes",
        sa.Column("attachment_url", sa.String(), nullable=True),
    )


def downgrade():
    op.drop_column("live_classes", "attachment_url")
