import hmac

from fastapi import APIRouter, Header

from app.core.config import settings
from app.core.exceptions import ApplicationError
from app.services.scheduler import run_scheduler_cycle


router = APIRouter(prefix="/cron", tags=["System"])


@router.get("/track", include_in_schema=False)
async def track_products(authorization: str | None = Header(default=None)) -> dict[str, object]:
    """Run one secured tracking cycle from Vercel Cron."""
    if not settings.cron_secret:
        raise ApplicationError("Cron is not configured", status_code=503)
    expected = f"Bearer {settings.cron_secret}"
    if authorization is None or not hmac.compare_digest(authorization, expected):
        raise ApplicationError("Unauthorized", status_code=401)

    result = await run_scheduler_cycle()
    if result is None:
        return {"status": "skipped", "reason": "another tracking cycle is running"}
    return {
        "status": "completed",
        "claimed": result.claimed,
        "checked": result.checked,
        "changed": result.changed,
        "notifications": result.notifications,
        "failed": result.failed,
    }
