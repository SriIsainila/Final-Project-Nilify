"""Add wallet, sneaker and dress catalog products.

Revision ID: 20260814_11
Revises: 20260812_10
"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260814_11"
down_revision: str | None = "20260812_10"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    products = sa.table(
        "catalog_products",
        sa.column("slug", sa.String),
        sa.column("name", sa.String),
        sa.column("category", sa.String),
        sa.column("description", sa.Text),
        sa.column("image_url", sa.String),
        sa.column("price", sa.Numeric),
        sa.column("stock_quantity", sa.Integer),
        sa.column("in_stock", sa.Boolean),
        sa.column("colour", sa.String),
    )
    op.bulk_insert(products, [
        {
            "slug": "black-leather-wallet",
            "name": "Black Leather Wallet",
            "category": "Fashion",
            "description": "A classic black leather wallet with card slots and a compact everyday design.",
            "image_url": "/products/black-leather-wallet.png",
            "price": 2500,
            "stock_quantity": 20,
            "in_stock": True,
            "colour": "Black",
        },
        {
            "slug": "white-green-sneakers",
            "name": "White & Green Sneakers",
            "category": "Fashion",
            "description": "Comfortable white platform sneakers with green accents and lace fastening.",
            "image_url": "/products/white-green-sneakers.png",
            "price": 7500,
            "stock_quantity": 15,
            "in_stock": True,
            "colour": "White & Green",
        },
        {
            "slug": "red-shirt-dress",
            "name": "Red Shirt Dress",
            "category": "Fashion",
            "description": "A comfortable button-front midi shirt dress with three-quarter sleeves and pockets.",
            "image_url": "/products/red-shirt-dress.png",
            "price": 4500,
            "stock_quantity": 12,
            "in_stock": True,
            "colour": "Red",
        },
    ])


def downgrade() -> None:
    op.execute(
        "DELETE FROM catalog_products WHERE slug IN "
        "('black-leather-wallet', 'white-green-sneakers', 'red-shirt-dress')"
    )
