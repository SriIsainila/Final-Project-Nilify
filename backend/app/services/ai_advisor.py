import json
from decimal import Decimal

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import ApplicationError
from app.models.price_history import PriceHistory
from app.models.tracked_item import TrackedItem
from app.schemas.ai import ProductAdvice


GEMINI_INTERACTIONS_URL = "https://generativelanguage.googleapis.com/v1beta/interactions"
ADVICE_SCHEMA = {
    "type": "object",
    "properties": {
        "recommendation": {"type": "string", "enum": ["buy", "wait", "watch"]},
        "confidence": {"type": "string", "enum": ["low", "medium", "high"]},
        "summary": {"type": "string", "maxLength": 300},
        "reasons": {
            "type": "array",
            "items": {"type": "string"},
            "minItems": 1,
            "maxItems": 3,
        },
    },
    "required": ["recommendation", "confidence", "summary", "reasons"],
    "additionalProperties": False,
}


def _number(value: Decimal | None) -> float | None:
    return float(value) if value is not None else None


async def _recent_prices(session: AsyncSession, item_id: int) -> list[PriceHistory]:
    result = await session.scalars(
        select(PriceHistory)
        .where(PriceHistory.item_id == item_id)
        .order_by(PriceHistory.recorded_at.desc())
        .limit(20)
    )
    return list(reversed(result.all()))


def _extract_output_text(payload: dict) -> str:
    if isinstance(payload.get("output_text"), str):
        return payload["output_text"]

    # Raw Gemini REST responses expose generated content as interaction steps.
    # ``output_text`` is a convenience field added by Google's SDKs.
    for step in reversed(payload.get("steps", [])):
        if step.get("type") != "model_output":
            continue
        text_parts = [
            content["text"]
            for content in step.get("content", [])
            if content.get("type") == "text" and isinstance(content.get("text"), str)
        ]
        if text_parts:
            return "".join(text_parts)

    for output in payload.get("output", []):
        for content in output.get("content", []):
            if content.get("type") == "output_text" and isinstance(content.get("text"), str):
                return content["text"]
    raise ApplicationError("AI returned an empty response", status_code=502)


async def generate_product_advice(
    session: AsyncSession,
    item: TrackedItem,
    *,
    client: httpx.AsyncClient | None = None,
) -> ProductAdvice:
    if not settings.gemini_api_key.strip():
        raise ApplicationError(
            "AI advice is not configured. Add NILIFY_GEMINI_API_KEY to backend/.env.",
            status_code=503,
        )

    history = await _recent_prices(session, item.item_id)
    prices = [_number(row.price) for row in history]
    context = {
        "product_name": item.title,
        "store": item.store_name,
        "currency": item.currency,
        "current_price": _number(item.current_price),
        "target_price": _number(item.target_price),
        "in_stock": item.in_stock,
        "price_history_oldest_to_newest": prices,
        "history_points": len(prices),
    }
    prompt = (
        "You are Nilify's cautious shopping assistant. Recommend buy, wait, or watch using only "
        "the supplied tracking data. Never invent market facts, product quality, discounts, or "
        "future prices. If data is sparse or the current price is missing, use low confidence and "
        "explain the limitation. Keep the summary practical and concise.\n\nTracking data:\n"
        f"{json.dumps(context, separators=(',', ':'))}"
    )
    request_body = {
        "model": settings.gemini_model,
        "input": prompt,
        "response_format": {
            "type": "text",
            "mime_type": "application/json",
            "schema": ADVICE_SCHEMA,
        },
    }

    owns_client = client is None
    http_client = client or httpx.AsyncClient(timeout=settings.gemini_timeout_seconds)
    try:
        response = await http_client.post(
            GEMINI_INTERACTIONS_URL,
            headers={
                "x-goog-api-key": settings.gemini_api_key,
                "Content-Type": "application/json",
            },
            json=request_body,
        )
        if response.status_code in {401, 403}:
            raise ApplicationError("The configured Gemini API key is invalid", status_code=503)
        if response.status_code == 429:
            raise ApplicationError("AI advice is temporarily rate limited. Try again shortly.", status_code=429)
        if response.is_error:
            raise ApplicationError("AI advice is temporarily unavailable", status_code=502)
        try:
            return ProductAdvice.model_validate_json(_extract_output_text(response.json()))
        except (ValueError, TypeError, json.JSONDecodeError) as error:
            raise ApplicationError("AI returned an invalid response", status_code=502) from error
    except httpx.TimeoutException as error:
        raise ApplicationError("AI advice request timed out", status_code=504) from error
    except httpx.RequestError as error:
        raise ApplicationError("Could not connect to the AI service", status_code=502) from error
    finally:
        if owns_client:
            await http_client.aclose()
