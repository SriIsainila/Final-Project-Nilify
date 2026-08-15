from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ApplicationError
from app.models.tracked_item import TrackedItem
from app.models.user import User
from app.schemas.product import ProductCreate, ProductUpdate
from app.utils.urls import hostname_from_url, normalize_product_url
from app.services.billing import plan_url_limit


DUPLICATE_URL = "You are already tracking this URL"


async def list_user_products(session: AsyncSession, user_id: int) -> list[TrackedItem]:
    result = await session.execute(
        select(TrackedItem)
        .where(TrackedItem.user_id == user_id)
        .order_by(TrackedItem.created_at.desc())
    )
    return list(result.scalars().all())


async def get_user_product(session: AsyncSession, user_id: int, item_id: int) -> TrackedItem:
    result = await session.execute(
        select(TrackedItem).where(
            TrackedItem.item_id == item_id,
            TrackedItem.user_id == user_id,
        )
    )
    item = result.scalar_one_or_none()
    if item is None:
        raise ApplicationError("Tracked URL not found", status_code=404)
    return item


async def ensure_url_available(
    session: AsyncSession,
    user_id: int,
    normalized_url: str,
    excluded_item_id: int | None = None,
) -> None:
    statement = select(TrackedItem.item_id).where(
        TrackedItem.user_id == user_id,
        TrackedItem.normalized_url == normalized_url,
    )
    if excluded_item_id is not None:
        statement = statement.where(TrackedItem.item_id != excluded_item_id)
    if (await session.execute(statement)).scalar_one_or_none() is not None:
        raise ApplicationError(DUPLICATE_URL, status_code=409)


async def create_product(session: AsyncSession, user_id: int, payload: ProductCreate) -> TrackedItem:
    user = await session.scalar(select(User).where(User.user_id == user_id).with_for_update())
    if user is None:
        raise ApplicationError("User account not found", status_code=404)
    normalized_url = normalize_product_url(payload.url)
    await ensure_url_available(session, user_id, normalized_url)
    if user.subscription_status == "active":
        url_limit = plan_url_limit(user.subscription_plan)
        tracked_count = await session.scalar(
            select(func.count()).select_from(TrackedItem).where(TrackedItem.user_id == user_id)
        )
        if url_limit is not None and (tracked_count or 0) >= url_limit:
            raise ApplicationError(
                f"Your current subscription allows up to {url_limit} tracked URL(s). Upgrade your plan to add more.",
                status_code=402,
                details={"subscription_required": True, "url_limit": url_limit},
            )
    if user.free_tracking_used >= 3 and user.subscription_status != "active":
        raise ApplicationError(
            "Your 3 free product tracking uses are finished. Choose a subscription to continue.",
            status_code=402,
            details={"subscription_required": True},
        )

    hostname = hostname_from_url(normalized_url)
    item = TrackedItem(
        user_id=user_id,
        url=payload.url,
        normalized_url=normalized_url,
        title=hostname,
        store_name=hostname,
        status="active",
        check_frequency=payload.check_frequency,
        target_price=payload.target_price,
        change_scope=payload.change_scope,
        notify_channel=payload.notify_channel,
        currency="LKR",
        in_stock=None,
        next_check_at=datetime.now(UTC),
    )
    session.add(item)
    if user.subscription_status != "active":
        user.free_tracking_used += 1
    try:
        await session.commit()
    except IntegrityError as error:
        await session.rollback()
        raise ApplicationError(DUPLICATE_URL, status_code=409) from error
    await session.refresh(item)
    return item


async def update_product(
    session: AsyncSession,
    user_id: int,
    item_id: int,
    payload: ProductUpdate,
) -> TrackedItem:
    item = await get_user_product(session, user_id, item_id)

    if "url" in payload.model_fields_set and payload.url is not None:
        normalized_url = normalize_product_url(payload.url)
        await ensure_url_available(session, user_id, normalized_url, item.item_id)
        item.url = payload.url
        item.normalized_url = normalized_url
        if "name" not in payload.model_fields_set:
            hostname = hostname_from_url(normalized_url)
            item.title = hostname
            item.store_name = hostname

    if "name" in payload.model_fields_set and payload.name is not None:
        item.title = payload.name
    if "target_price" in payload.model_fields_set:
        item.target_price = payload.target_price
    if "change_scope" in payload.model_fields_set and payload.change_scope is not None:
        item.change_scope = payload.change_scope
    if "notify_channel" in payload.model_fields_set and payload.notify_channel is not None:
        item.notify_channel = payload.notify_channel
    if "check_frequency" in payload.model_fields_set and payload.check_frequency is not None:
        item.check_frequency = payload.check_frequency

    try:
        await session.commit()
    except IntegrityError as error:
        await session.rollback()
        raise ApplicationError(DUPLICATE_URL, status_code=409) from error
    await session.refresh(item)
    return item


async def delete_product(session: AsyncSession, user_id: int, item_id: int) -> None:
    item = await get_user_product(session, user_id, item_id)
    await session.delete(item)
    await session.commit()


async def set_tracking_status(
    session: AsyncSession,
    user_id: int,
    item_id: int,
    status: str,
) -> TrackedItem:
    item = await get_user_product(session, user_id, item_id)
    item.status = status
    if status == "active":
        item.next_check_at = datetime.now(UTC)
    await session.commit()
    await session.refresh(item)
    return item
