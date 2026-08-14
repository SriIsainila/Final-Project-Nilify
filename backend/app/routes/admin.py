import asyncio
import logging
import re

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import func, select

from app.models.notification import Notification
from app.models.tracked_item import TrackedItem
from app.models.user import User
from app.models.catalog_product import CatalogProduct
from app.routes.dependencies import AdminUser, DatabaseSession
from app.schemas.admin import AdminDashboardStats
from app.schemas.catalog_product import CatalogProductCreate, CatalogProductDeleteResponse, CatalogProductRead, CatalogProductUpdate
from app.services.tracking_worker import check_tracked_url
from app.utils.urls import catalog_slug_from_url


router = APIRouter(prefix="/admin", tags=["Admin"])
logger = logging.getLogger(__name__)


async def check_users_tracking_product(session, slug: str) -> None:
    tracked_items = (
        await session.execute(
            select(TrackedItem.item_id, TrackedItem.url).where(TrackedItem.status == "active")
        )
    ).all()
    item_ids = [item_id for item_id, url in tracked_items if catalog_slug_from_url(url) == slug]
    if not item_ids:
        return

    results = await asyncio.gather(
        *(check_tracked_url(item_id) for item_id in item_ids),
        return_exceptions=True,
    )
    for item_id, result in zip(item_ids, results, strict=True):
        if isinstance(result, Exception):
            logger.error(
                "Immediate tracking check failed for item %s after admin product update: %s",
                item_id,
                result,
            )


def product_read(product: CatalogProduct) -> CatalogProductRead:
    return CatalogProductRead(
        id=product.product_id,
        slug=product.slug,
        product_url=f"/products/{product.slug}",
        name=product.name,
        category=product.category,
        description=product.description,
        image_url=product.image_url,
        price=product.price,
        stock_quantity=product.stock_quantity,
        in_stock=product.in_stock,
        colour=product.colour,
        created_at=product.created_at,
        updated_at=product.updated_at,
    )


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.strip().lower()).strip("-")
    return slug[:100] or "product"


async def unique_slug(session, requested: str | None, name: str) -> str:
    base = requested or slugify(name)
    candidate = base
    suffix = 2
    while await session.scalar(select(CatalogProduct.product_id).where(CatalogProduct.slug == candidate)):
        ending = f"-{suffix}"
        candidate = f"{base[:100-len(ending)]}{ending}"
        suffix += 1
    return candidate


@router.get("/dashboard", response_model=AdminDashboardStats)
async def dashboard_stats(_: AdminUser, session: DatabaseSession) -> AdminDashboardStats:
    total_users = await session.scalar(select(func.count()).select_from(User))
    active_subscriptions = await session.scalar(
        select(func.count()).select_from(User).where(User.subscription_status == "active")
    )
    tracked_products = await session.scalar(select(func.count()).select_from(TrackedItem))
    notifications = await session.scalar(select(func.count()).select_from(Notification))
    return AdminDashboardStats(
        total_users=total_users or 0,
        active_subscriptions=active_subscriptions or 0,
        tracked_products=tracked_products or 0,
        notifications=notifications or 0,
    )


@router.get("/products", response_model=list[CatalogProductRead])
async def list_products(_: AdminUser, session: DatabaseSession) -> list[CatalogProductRead]:
    products = (await session.scalars(select(CatalogProduct).order_by(CatalogProduct.product_id))).all()
    return [product_read(product) for product in products]


@router.post("/products", response_model=CatalogProductRead, status_code=status.HTTP_201_CREATED)
async def create_catalog_product(payload: CatalogProductCreate, _: AdminUser, session: DatabaseSession) -> CatalogProductRead:
    values = payload.model_dump(exclude={"slug"})
    product = CatalogProduct(**values, slug=await unique_slug(session, payload.slug, payload.name))
    session.add(product)
    await session.commit()
    await session.refresh(product)
    await check_users_tracking_product(session, product.slug)
    return product_read(product)


@router.get("/products/{product_id}", response_model=CatalogProductRead)
async def get_product(product_id: int, _: AdminUser, session: DatabaseSession) -> CatalogProductRead:
    product = await session.get(CatalogProduct, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product_read(product)


@router.put("/products/{product_id}", response_model=CatalogProductRead)
async def update_product(product_id: int, payload: CatalogProductUpdate, _: AdminUser, session: DatabaseSession) -> CatalogProductRead:
    product = await session.get(CatalogProduct, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    for field, value in payload.model_dump().items():
        setattr(product, field, value)
    await session.commit()
    await session.refresh(product)
    await check_users_tracking_product(session, product.slug)
    return product_read(product)


@router.delete("/products/{product_id}", response_model=CatalogProductDeleteResponse)
async def delete_catalog_product(product_id: int, _: AdminUser, session: DatabaseSession) -> CatalogProductDeleteResponse:
    product = await session.get(CatalogProduct, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    await session.delete(product)
    await session.commit()
    return CatalogProductDeleteResponse(message="Product deleted")
