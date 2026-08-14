"""Add free tracking quota and PayHere subscription records.

Revision ID: 20260806_06
Revises: 20260727_05
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260806_06"
down_revision: str | None = "20260727_05"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("users", sa.Column("free_tracking_used", sa.Integer(), server_default="0", nullable=False))
    op.add_column("users", sa.Column("subscription_plan", sa.String(16)))
    op.add_column("users", sa.Column("subscription_status", sa.String(16), server_default="inactive", nullable=False))
    op.add_column("users", sa.Column("payhere_subscription_id", sa.String(100)))
    op.add_column("users", sa.Column("subscription_next_payment_at", sa.DateTime(timezone=True)))
    op.create_unique_constraint("uq_users_payhere_subscription", "users", ["payhere_subscription_id"])
    op.execute(
        "UPDATE users SET free_tracking_used = LEAST(3, (SELECT COUNT(*) FROM tracked_items "
        "WHERE tracked_items.user_id = users.user_id))"
    )
    op.create_table(
        "payment_orders",
        sa.Column("order_id", sa.String(64), primary_key=True),
        sa.Column("user_id", sa.BigInteger(), sa.ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False),
        sa.Column("plan", sa.String(16), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("currency", sa.String(3), nullable=False, server_default="LKR"),
        sa.Column("status", sa.String(16), nullable=False, server_default="pending"),
        sa.Column("payment_id", sa.String(100)),
        sa.Column("subscription_id", sa.String(100)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_payment_orders_user_id", "payment_orders", ["user_id"])
    op.create_index("ix_payment_orders_subscription_id", "payment_orders", ["subscription_id"])


def downgrade() -> None:
    op.drop_table("payment_orders")
    op.drop_constraint("uq_users_payhere_subscription", "users", type_="unique")
    op.drop_column("users", "subscription_next_payment_at")
    op.drop_column("users", "payhere_subscription_id")
    op.drop_column("users", "subscription_status")
    op.drop_column("users", "subscription_plan")
    op.drop_column("users", "free_tracking_used")
