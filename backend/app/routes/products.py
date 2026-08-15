from fastapi import APIRouter, status

from app.routes.dependencies import DatabaseSession, NormalUser
from app.schemas.ai import ProductAdvice
from app.schemas.product import (
    DeleteResponse,
    ProductCreate,
    ProductRead,
    ProductStatusResponse,
    ProductUpdate,
)
from app.services.ai_advisor import generate_product_advice
from app.services.products import (
    create_product,
    delete_product,
    get_user_product,
    list_user_products,
    set_tracking_status,
    update_product,
)
from app.services.tracking_worker import check_tracked_url
from app.utils.urls import catalog_slug_from_url


router = APIRouter(prefix="/products", tags=["Products"])


@router.post("", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
async def add_url(payload: ProductCreate, session: DatabaseSession, user: NormalUser) -> ProductRead:
    item = await create_product(session, user.user_id, payload)
    if catalog_slug_from_url(item.normalized_url) is not None:
        await check_tracked_url(item.item_id)
        item = await get_user_product(session, user.user_id, item.item_id)
        await session.refresh(item)
    return ProductRead.from_item(item)


@router.get("", response_model=list[ProductRead])
async def list_urls(session: DatabaseSession, user: NormalUser) -> list[ProductRead]:
    items = await list_user_products(session, user.user_id)
    return [ProductRead.from_item(item) for item in items]


@router.get("/{item_id}", response_model=ProductRead)
async def get_url(item_id: int, session: DatabaseSession, user: NormalUser) -> ProductRead:
    item = await get_user_product(session, user.user_id, item_id)
    return ProductRead.from_item(item)


@router.patch("/{item_id}", response_model=ProductRead)
async def update_url(
    item_id: int,
    payload: ProductUpdate,
    session: DatabaseSession,
    user: NormalUser,
) -> ProductRead:
    item = await update_product(session, user.user_id, item_id, payload)
    return ProductRead.from_item(item)


@router.delete("/{item_id}", response_model=DeleteResponse)
async def remove_url(item_id: int, session: DatabaseSession, user: NormalUser) -> DeleteResponse:
    await delete_product(session, user.user_id, item_id)
    return DeleteResponse(message="Tracked URL deleted")


@router.post("/{item_id}/enable", response_model=ProductStatusResponse)
async def enable_tracking(
    item_id: int,
    session: DatabaseSession,
    user: NormalUser,
) -> ProductStatusResponse:
    item = await set_tracking_status(session, user.user_id, item_id, "active")
    return ProductStatusResponse(id=item.item_id, status=item.status)


@router.post("/{item_id}/disable", response_model=ProductStatusResponse)
async def disable_tracking(
    item_id: int,
    session: DatabaseSession,
    user: NormalUser,
) -> ProductStatusResponse:
    item = await set_tracking_status(session, user.user_id, item_id, "paused")
    return ProductStatusResponse(id=item.item_id, status=item.status)


@router.post("/{item_id}/ai-advice", response_model=ProductAdvice)
async def get_ai_advice(
    item_id: int,
    session: DatabaseSession,
    user: NormalUser,
) -> ProductAdvice:
    item = await get_user_product(session, user.user_id, item_id)
    return await generate_product_advice(session, item)
