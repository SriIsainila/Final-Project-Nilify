"""Add support for recurring no-change notifications.

Revision ID: 20260809_07
Revises: 20260806_06
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op


revision: str = "20260809_07"
down_revision: str | None = "20260806_06"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "tracked_items",
        sa.Column("no_change_notified_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column("notifications", sa.Column("item_id", sa.BigInteger(), nullable=True))
    op.create_foreign_key(
        "fk_notifications_item_id_tracked_items",
        "notifications",
        "tracked_items",
        ["item_id"],
        ["item_id"],
        ondelete="CASCADE",
    )
    op.create_index("ix_notifications_item_id", "notifications", ["item_id"])


def downgrade() -> None:
    op.drop_index("ix_notifications_item_id", table_name="notifications")
    op.drop_constraint("fk_notifications_item_id_tracked_items", "notifications", type_="foreignkey")
    op.drop_column("notifications", "item_id")
    op.drop_column("tracked_items", "no_change_notified_at")
