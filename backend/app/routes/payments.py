from fastapi import APIRouter, Request

from app.core.exceptions import ApplicationError
from app.models.payment_order import PaymentOrder
from app.routes.dependencies import DatabaseSession, NormalUser
from app.schemas.billing import CheckoutCreate, CheckoutResponse, PaymentStatusResponse
from app.services.billing import create_checkout, process_notification


router = APIRouter(prefix="/payments/payhere", tags=["Payments"])


@router.post("/create", response_model=CheckoutResponse)
async def create_payhere_payment(
    payload: CheckoutCreate,
    session: DatabaseSession,
    user: NormalUser,
) -> CheckoutResponse:
    return await create_checkout(session, user, payload)


@router.get("/{order_id}/status", response_model=PaymentStatusResponse)
async def get_payhere_payment_status(
    order_id: str,
    session: DatabaseSession,
    user: NormalUser,
) -> PaymentStatusResponse:
    order = await session.get(PaymentOrder, order_id)
    if order is None or order.user_id != user.user_id:
        raise ApplicationError("Payment order not found", status_code=404)
    return PaymentStatusResponse(
        order_id=order.order_id,
        plan=order.plan,
        payment_status=order.status,
    )


@router.post("/notify", status_code=200)
async def notify_payhere_payment(request: Request, session: DatabaseSession) -> dict[str, str]:
    form = await request.form()
    await process_notification(session, {key: str(value) for key, value in form.items()})
    return {"status": "ok"}
