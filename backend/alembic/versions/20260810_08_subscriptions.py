"""Add subscription periods for verified PayHere payments.

Revision ID: 20260810_08
Revises: 20260809_07
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op


revision: str = "20260810_08"
down_revision: str | None = "20260809_07"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "subscriptions" not in inspector.get_table_names():
        op.create_table(
            "subscriptions",
            sa.Column("user_id", sa.BigInteger(), nullable=False),
            sa.Column("plan", sa.String(16), nullable=False),
            sa.Column("start_date", sa.DateTime(timezone=True), nullable=False),
            sa.Column("end_date", sa.DateTime(timezone=True), nullable=False),
            sa.Column("status", sa.String(16), server_default="active", nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.ForeignKeyConstraint(["user_id"], ["users.user_id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("user_id"),
        )
        return

    # Older Nilify builds created this table outside Alembic with subscription_id
    # as its primary key and plan_name as the plan column. Reconcile it in place
    # so existing rows and user relationships are preserved.
    columns = {column["name"] for column in inspector.get_columns("subscriptions")}
    if "plan_name" in columns and "plan" not in columns:
        op.alter_column("subscriptions", "plan_name", new_column_name="plan")
    elif "plan" not in columns:
        op.add_column(
            "subscriptions",
            sa.Column("plan", sa.String(16), server_default="monthly", nullable=False),
        )
    if "updated_at" not in columns:
        op.add_column(
            "subscriptions",
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        )

    op.execute(
        "UPDATE subscriptions SET end_date = start_date + CASE plan "
        "WHEN 'weekly' THEN INTERVAL '7 days' WHEN 'yearly' THEN INTERVAL '1 year' "
        "ELSE INTERVAL '1 month' END WHERE end_date IS NULL"
    )
    op.alter_column("subscriptions", "end_date", nullable=False)

    inspector = sa.inspect(bind)
    for constraint in inspector.get_check_constraints("subscriptions"):
        if constraint["name"] in {"subscriptions_status_check", "valid_subscription_dates"}:
            op.drop_constraint(op.f(constraint["name"]), "subscriptions", type_="check")

    primary_key = inspector.get_pk_constraint("subscriptions")
    if primary_key.get("constrained_columns") != ["user_id"]:
        if primary_key.get("name"):
            op.drop_constraint(op.f(primary_key["name"]), "subscriptions", type_="primary")
        for constraint in inspector.get_unique_constraints("subscriptions"):
            if constraint.get("column_names") == ["user_id"] and constraint.get("name"):
                op.drop_constraint(op.f(constraint["name"]), "subscriptions", type_="unique")
        if "subscription_id" in columns:
            op.drop_column("subscriptions", "subscription_id")
        op.create_primary_key("pk_subscriptions", "subscriptions", ["user_id"])


def downgrade() -> None:
    op.drop_table("subscriptions")
