import hashlib
import hmac
from calendar import monthrange
from datetime import UTC, datetime, timedelta
from decimal import Decimal, InvalidOperation
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import ApplicationError
from app.models.payment_order import PaymentOrder, Subscription
from app.models.user import User
from app.schemas.billing import BillingStatus, CheckoutCreate, CheckoutResponse


FREE_TRACKING_LIMIT = 3
PLANS = {
    "url_1": {"amount": Decimal("200.00"), "recurrence": "1 Month", "months": 1, "url_limit": 1, "label": "Nilify 1 URL"},
    "url_10": {"amount": Decimal("1500.00"), "recurrence": "5 Month", "months": 5, "url_limit": 10, "label": "Nilify 10 URLs"},
    "url_20": {"amount": Decimal("3000.00"), "recurrence": "5 Month", "months": 5, "url_limit": 20, "label": "Nilify 20 URLs"},
    "url_35": {"amount": Decimal("6000.00"), "recurrence": "6 Month", "months": 6, "url_limit": 35, "label": "Nilify 35 URLs"},
    "url_50": {"amount": Decimal("10000.00"), "recurrence": "1 Year", "months": 12, "url_limit": 50, "label": "Nilify 50 URLs"},
}
LEGACY_PLANS = {"weekly", "monthly", "yearly"}


def plan_url_limit(plan: str | None) -> int | None:
    if plan in LEGACY_PLANS:
        return None
    details = PLANS.get(plan or "")
    return int(details["url_limit"]) if details else 0


def require_payhere_sandbox_configuration() -> None:
    if not settings.payhere_sandbox:
        raise ApplicationError("Only PayHere Sandbox is enabled", status_code=503)
    missing = [
        name
        for name, value in (
            ("PAYHERE_MERCHANT_ID", settings.payhere_merchant_id),
            ("PAYHERE_MERCHANT_SECRET", settings.payhere_merchant_secret),
            ("PUBLIC_BACKEND_URL", settings.public_backend_url),
        )
        if not value.strip()
    ]
    if missing:
        raise ApplicationError(
            f"PayHere Sandbox is not configured; missing: {', '.join(missing)}",
            status_code=503,
        )


def subscription_end(start: datetime, plan: str) -> datetime:
    if plan in PLANS:
        months = int(PLANS[plan]["months"])
        month_index = start.month - 1 + months
        year = start.year + month_index // 12
        month = month_index % 12 + 1
        day = min(start.day, monthrange(year, month)[1])
        return start.replace(year=year, month=month, day=day)
    if plan == "weekly":
        return start + timedelta(days=7)
    if plan == "yearly":
        year = start.year + 1
        day = min(start.day, monthrange(year, start.month)[1])
        return start.replace(year=year, day=day)
    month_index = start.month
    year = start.year + month_index // 12
    month = month_index % 12 + 1
    day = min(start.day, monthrange(year, month)[1])
    return start.replace(year=year, month=month, day=day)


def merchant_hash(order_id: str, amount: Decimal, currency: str = "LKR") -> str:
    secret_hash = hashlib.md5(settings.payhere_merchant_secret.encode()).hexdigest().upper()
    value = f"{settings.payhere_merchant_id}{order_id}{amount:.2f}{currency}{secret_hash}"
    return hashlib.md5(value.encode()).hexdigest().upper()


def notification_signature(data: dict[str, str]) -> str:
    secret_hash = hashlib.md5(settings.payhere_merchant_secret.encode()).hexdigest().upper()
    value = "".join(
        data[key]
        for key in ("merchant_id", "order_id", "payhere_amount", "payhere_currency", "status_code")
    ) + secret_hash
    return hashlib.md5(value.encode()).hexdigest().upper()


def billing_status(user: User) -> BillingStatus:
    used = min(user.free_tracking_used, FREE_TRACKING_LIMIT)
    return BillingStatus(
        free_used=used,
        free_remaining=max(0, FREE_TRACKING_LIMIT - used),
        subscription_plan=user.subscription_plan,
        subscription_status=user.subscription_status,
        next_payment_at=user.subscription_next_payment_at,
    )


async def create_checkout(session: AsyncSession, user: User, payload: CheckoutCreate) -> CheckoutResponse:
    require_payhere_sandbox_configuration()
    plan = PLANS[payload.plan]
    order_id = f"nilify-{user.user_id}-{uuid4().hex}"
    order = PaymentOrder(
        order_id=order_id,
        user_id=user.user_id,
        plan=payload.plan,
        amount=plan["amount"],
        currency="LKR",
    )
    session.add(order)
    await session.commit()
    names = user.full_name.strip().split(maxsplit=1)
    fields = {
        "merchant_id": settings.payhere_merchant_id,
        "return_url": f"{settings.frontend_url.rstrip('/')}/pricing?payment=returned",
        "cancel_url": f"{settings.frontend_url.rstrip('/')}/pricing?payment=cancelled",
        "notify_url": f"{settings.public_backend_url.rstrip('/')}{settings.api_prefix}/payments/payhere/notify",
        "order_id": order_id,
        "items": str(plan["label"]),
        "currency": "LKR",
        "recurrence": str(plan["recurrence"]),
        "duration": "Forever",
        "amount": f"{plan['amount']:.2f}",
        "first_name": names[0],
        "last_name": names[1] if len(names) > 1 else "-",
        "email": user.email,
        "phone": payload.phone,
        "address": payload.address,
        "city": payload.city,
        "country": "Sri Lanka",
        "custom_1": str(user.user_id),
        "custom_2": payload.plan,
        "hash": merchant_hash(order_id, plan["amount"]),
    }
    checkout_url = "https://sandbox.payhere.lk/pay/checkout"
    return CheckoutResponse(checkout_url=checkout_url, fields=fields)


async def process_notification(session: AsyncSession, data: dict[str, str]) -> None:
    require_payhere_sandbox_configuration()
    required = {"merchant_id", "order_id", "payhere_amount", "payhere_currency", "status_code", "md5sig"}
    if not required.issubset(data):
        raise ApplicationError("Invalid payment notification", status_code=400)
    if data["merchant_id"] != settings.payhere_merchant_id or not hmac.compare_digest(
        notification_signature(data), data["md5sig"].upper()
    ):
        raise ApplicationError("Invalid payment signature", status_code=400)
    result = await session.execute(
        select(PaymentOrder).where(PaymentOrder.order_id == data["order_id"]).with_for_update()
    )
    order = result.scalar_one_or_none()
    try:
        notified_amount = Decimal(data["payhere_amount"])
    except (ValueError, InvalidOperation):
        raise ApplicationError("Invalid payment amount", status_code=400) from None
    if (
        order is None
        or order.amount != notified_amount
        or order.currency != data["payhere_currency"].upper()
    ):
        raise ApplicationError("Payment order mismatch", status_code=400)

    incoming_payment_id = data.get("payment_id")
    if order.status == "paid" and incoming_payment_id and order.payment_id == incoming_payment_id:
        return

    order.payment_id = incoming_payment_id or order.payment_id
    order.subscription_id = data.get("subscription_id")
    user = await session.get(User, order.user_id)
    if user is None:
        raise ApplicationError("Payment user not found", status_code=400)
    if data["status_code"] == "2":
        now = datetime.now(UTC)
        end_date = subscription_end(now, order.plan)
        order.status = "paid"
        user.subscription_plan = order.plan
        user.subscription_status = "active"
        user.payhere_subscription_id = data.get("subscription_id") or user.payhere_subscription_id
        subscription = await session.get(Subscription, order.user_id)
        if subscription is None:
            subscription = Subscription(
                user_id=order.user_id,
                plan=order.plan,
                start_date=now,
                end_date=end_date,
                status="active",
            )
            session.add(subscription)
        else:
            subscription.plan = order.plan
            subscription.start_date = now
            subscription.end_date = end_date
            subscription.status = "active"
        next_date = data.get("item_rec_date_next")
        if next_date:
            try:
                user.subscription_next_payment_at = datetime.strptime(next_date, "%Y-%m-%d").replace(tzinfo=UTC)
            except ValueError:
                pass
        else:
            user.subscription_next_payment_at = end_date
    elif data["status_code"] == "0":
        order.status = "pending"
    else:
        order.status = {
            "-1": "cancelled",
            "-2": "failed",
            "-3": "chargedback",
        }.get(data["status_code"], "failed")
        if data.get("message_type") in {"RECURRING_INSTALLMENT_FAILED", "RECURRING_STOPPED"}:
            user.subscription_status = "past_due" if data["status_code"] == "-2" else "cancelled"
            subscription = await session.get(Subscription, order.user_id)
            if subscription is not None:
                subscription.status = user.subscription_status
    await session.commit()
