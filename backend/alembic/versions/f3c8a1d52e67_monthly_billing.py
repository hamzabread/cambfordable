"""monthly billing: due dates, pauses and payment proof history

Revision ID: f3c8a1d52e67
Revises: e5a9c3d71b24
Create Date: 2026-11-02 18:00:00.000000
"""

from alembic import context, op
import sqlalchemy as sa


revision = "f3c8a1d52e67"
down_revision = "e5a9c3d71b24"
branch_labels = None
depends_on = None


def upgrade() -> None:
    inspector = None if context.is_offline_mode() else sa.inspect(op.get_bind())
    tables = set() if inspector is None else set(inspector.get_table_names())
    columns = set() if inspector is None else {c["name"] for c in inspector.get_columns("enrollments")}

    for name, column in [
        ("paid_until", sa.Column("paid_until", sa.DateTime(timezone=True), nullable=True)),
        ("paused_at", sa.Column("paused_at", sa.DateTime(timezone=True), nullable=True)),
        ("proof_pending", sa.Column("proof_pending", sa.Boolean(), nullable=False, server_default=sa.false())),
        ("reminder_sent_for", sa.Column("reminder_sent_for", sa.DateTime(timezone=True), nullable=True)),
        ("overdue_notice_for", sa.Column("overdue_notice_for", sa.DateTime(timezone=True), nullable=True)),
    ]:
        if name not in columns:
            op.add_column("enrollments", column)

    # An unpaid enrollment with a proof is a proof waiting for review.
    op.execute(
        "UPDATE enrollments SET proof_pending = TRUE "
        "WHERE paid = FALSE AND payment_proof_url IS NOT NULL"
    )

    if "payment_proofs" not in tables:
        op.create_table(
            "payment_proofs",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("course_id", sa.Integer(), nullable=False),
            sa.Column("file_url", sa.String(), nullable=False),
            sa.Column("original_name", sa.String(), nullable=True),
            sa.Column("status", sa.String(length=20), nullable=False, server_default="pending"),
            sa.Column("rejection_reason", sa.Text(), nullable=True),
            sa.Column("uploaded_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["course_id"], ["courses.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_payment_proofs_id", "payment_proofs", ["id"])
        op.create_index("ix_payment_proofs_user_id", "payment_proofs", ["user_id"])
        op.create_index("ix_payment_proofs_course_id", "payment_proofs", ["course_id"])
        op.create_index("ix_payment_proofs_uploaded_at", "payment_proofs", ["uploaded_at"])
        # Existing proofs become the start of each student's payment history.
        op.execute(
            "INSERT INTO payment_proofs (user_id, course_id, file_url, original_name, status, uploaded_at) "
            "SELECT user_id, course_id, payment_proof_url, payment_proof_name, "
            "CASE WHEN paid THEN 'approved' ELSE 'pending' END, COALESCE(enrolled_at, CURRENT_TIMESTAMP) "
            "FROM enrollments WHERE payment_proof_url IS NOT NULL"
        )


def downgrade() -> None:
    op.drop_index("ix_payment_proofs_uploaded_at", table_name="payment_proofs")
    op.drop_index("ix_payment_proofs_course_id", table_name="payment_proofs")
    op.drop_index("ix_payment_proofs_user_id", table_name="payment_proofs")
    op.drop_index("ix_payment_proofs_id", table_name="payment_proofs")
    op.drop_table("payment_proofs")
    for name in ["overdue_notice_for", "reminder_sent_for", "proof_pending", "paused_at", "paid_until"]:
        op.drop_column("enrollments", name)
