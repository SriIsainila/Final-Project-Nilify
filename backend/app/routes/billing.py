from fastapi import APIRouter, Request

from app.routes.dependencies import DatabaseSession, NormalUser
from app.schemas.billing import BillingStatus, CheckoutCreate, CheckoutResponse
from app.services.billing import billing_status, create_checkout, process_notification

router = APIRouter(prefix="/billing", tags=["Billing"])


@router.get("/status", response_model=BillingStatus)
async def status(user: NormalUser) -> BillingStatus:
    return billing_status(user)


@router.post("/checkout", response_model=CheckoutResponse)
async def checkout(payload: CheckoutCreate, session: DatabaseSession, user: NormalUser) -> CheckoutResponse:
    return await create_checkout(session, user, payload)


@router.post("/payhere/notify", status_code=200)
async def payhere_notify(request: Request, session: DatabaseSession) -> dict[str, str]:
    form = await request.form()
    await process_notification(session, {key: str(value) for key, value in form.items()})
    return {"status": "ok"}
