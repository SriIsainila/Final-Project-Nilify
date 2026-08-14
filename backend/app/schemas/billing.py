from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class CheckoutCreate(BaseModel):
    plan: Literal["url_1", "url_10", "url_20", "url_35", "url_50"]
    phone: str = Field(min_length=7, max_length=20)
    address: str = Field(min_length=3, max_length=200)
    city: str = Field(min_length=2, max_length=100)


class CheckoutResponse(BaseModel):
    checkout_url: str
    fields: dict[str, str]


class PaymentStatusResponse(BaseModel):
    order_id: str
    plan: str
    payment_status: str


class BillingStatus(BaseModel):
    free_limit: int = 3
    free_used: int
    free_remaining: int
    subscription_plan: str | None
    subscription_status: str
    next_payment_at: datetime | None
