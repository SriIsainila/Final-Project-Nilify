from fastapi import APIRouter, Query

from app.routes.dependencies import DatabaseSession, NormalUser
from app.schemas.notification import (
    DeleteNotificationResponse,
    MarkAllReadResponse,
    NotificationRead,
    NotificationStatusResponse,
)
from app.services.notifications import (
    delete_notification,
    list_notifications,
    mark_all_notifications_read,
    mark_notification_read,
)


router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=list[NotificationRead])
async def get_notifications(
    session: DatabaseSession,
    user: NormalUser,
    unread: bool = False,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> list[NotificationRead]:
    return await list_notifications(
        session,
        user.user_id,
        unread_only=unread,
        limit=limit,
        offset=offset,
    )


@router.get("/unread", response_model=list[NotificationRead])
async def get_unread_notifications(
    session: DatabaseSession,
    user: NormalUser,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> list[NotificationRead]:
    return await list_notifications(
        session,
        user.user_id,
        unread_only=True,
        limit=limit,
        offset=offset,
    )


@router.patch("/read-all", response_model=MarkAllReadResponse)
async def read_all(session: DatabaseSession, user: NormalUser) -> MarkAllReadResponse:
    updated = await mark_all_notifications_read(session, user.user_id)
    return MarkAllReadResponse(updated=updated)


@router.patch("/{notification_id}/read", response_model=NotificationStatusResponse)
async def read_one(
    notification_id: int,
    session: DatabaseSession,
    user: NormalUser,
) -> NotificationStatusResponse:
    notification = await mark_notification_read(session, user.user_id, notification_id)
    return NotificationStatusResponse(id=notification.notification_id, is_read=notification.is_read)


@router.delete("/{notification_id}", response_model=DeleteNotificationResponse)
async def remove_notification(
    notification_id: int,
    session: DatabaseSession,
    user: NormalUser,
) -> DeleteNotificationResponse:
    await delete_notification(session, user.user_id, notification_id)
    return DeleteNotificationResponse(message="Notification deleted")
