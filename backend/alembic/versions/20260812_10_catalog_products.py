"""Add admin-managed catalog products.

Revision ID: 20260812_10
Revises: 20260812_09
"""
from collections.abc import Sequence
import sqlalchemy as sa
from alembic import op

revision: str = "20260812_10"
down_revision: str | None = "20260812_09"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "catalog_products",
        sa.Column("product_id", sa.Integer(), primary_key=True),
        sa.Column("slug", sa.String(100), nullable=False),
        sa.Column("name", sa.String(150), nullable=False),
        sa.Column("category", sa.String(80), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("image_url", sa.String(500), nullable=False),
        sa.Column("price", sa.Numeric(12, 2), nullable=False),
        sa.Column("stock_quantity", sa.Integer(), server_default="0", nullable=False),
        sa.Column("in_stock", sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column("colour", sa.String(80), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("price > 0", name="ck_catalog_products_price_positive"),
        sa.CheckConstraint("stock_quantity >= 0", name="ck_catalog_products_stock_nonnegative"),
        sa.UniqueConstraint("slug"),
    )
    op.create_index("ix_catalog_products_slug", "catalog_products", ["slug"], unique=True)
    products = sa.table(
        "catalog_products",
        sa.column("slug", sa.String), sa.column("name", sa.String), sa.column("category", sa.String),
        sa.column("description", sa.Text), sa.column("image_url", sa.String), sa.column("price", sa.Numeric),
        sa.column("stock_quantity", sa.Integer), sa.column("in_stock", sa.Boolean), sa.column("colour", sa.String),
    )
    op.bulk_insert(products, [
        {"slug": "wooden-building-blocks", "name": "Wooden Building Blocks", "category": "Toys", "description": "A colourful wooden building set designed for creative play and early learning.", "image_url": "/products/wooden-building-blocks.png", "price": 2450, "stock_quantity": 18, "in_stock": True, "colour": "Green & Natural"},
        {"slug": "premium-chocolate-box", "name": "Premium Chocolate Box", "category": "Chocolate", "description": "A carefully selected gift box with assorted milk and dark chocolates.", "image_url": "/products/premium-chocolate-box.png", "price": 3200, "stock_quantity": 24, "in_stock": True, "colour": "Dark Green"},
        {"slug": "wireless-headphones", "name": "Wireless Headphones", "category": "Electronics", "description": "Comfortable over-ear wireless headphones with a clean modern finish.", "image_url": "/products/wireless-headphones.png", "price": 12900, "stock_quantity": 9, "in_stock": True, "colour": "Forest Green"},
        {"slug": "smart-shopping-book", "name": "Smart Shopping Book", "category": "Books", "description": "A practical guide to smarter spending, product research and personal finance.", "image_url": "/products/smart-shopping-book.png", "price": 1850, "stock_quantity": 31, "in_stock": True, "colour": "Cream"},
        {"slug": "botanical-skincare-set", "name": "Botanical Skincare Set", "category": "Beauty", "description": "A gentle cleanser and moisturiser set inspired by botanical ingredients.", "image_url": "/products/botanical-skincare-set.png", "price": 4750, "stock_quantity": 12, "in_stock": True, "colour": "Botanical Green"},
    ])


def downgrade() -> None:
    op.drop_index("ix_catalog_products_slug", table_name="catalog_products")
    op.drop_table("catalog_products")
