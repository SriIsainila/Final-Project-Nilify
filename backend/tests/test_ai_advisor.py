from decimal import Decimal
from types import SimpleNamespace

import httpx
import pytest

from app.core.config import settings
from app.core.exceptions import ApplicationError
from app.services.ai_advisor import generate_product_advice


class ScalarResult:
    def __init__(self, rows: list[object]) -> None:
        self.rows = rows

    def all(self) -> list[object]:
        return self.rows


class FakeSession:
    async def scalars(self, _statement: object) -> ScalarResult:
        newest_first = [
            SimpleNamespace(price=Decimal("80.00")),
            SimpleNamespace(price=Decimal("90.00")),
            SimpleNamespace(price=Decimal("100.00")),
        ]
        return ScalarResult(newest_first)


def tracked_item() -> SimpleNamespace:
    return SimpleNamespace(
        item_id=7,
        title="Test product",
        store_name="Example store",
        currency="LKR",
        current_price=Decimal("80.00"),
        target_price=Decimal("85.00"),
        in_stock=True,
    )


@pytest.mark.asyncio
async def test_ai_advice_requires_server_key(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "gemini_api_key", "")

    with pytest.raises(ApplicationError, match="NILIFY_GEMINI_API_KEY") as caught:
        await generate_product_advice(FakeSession(), tracked_item())

    assert caught.value.status_code == 503


@pytest.mark.asyncio
async def test_ai_advice_uses_structured_response(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "gemini_api_key", "test-key")

    def respond(request: httpx.Request) -> httpx.Response:
        assert request.headers["x-goog-api-key"] == "test-key"
        request_json = __import__("json").loads(request.content)
        assert request_json["response_format"]["mime_type"] == "application/json"
        assert request_json["model"] == settings.gemini_model
        return httpx.Response(
            200,
            json={
                "status": "completed",
                "steps": [
                    {
                        "type": "model_output",
                        "content": [
                            {
                                "type": "text",
                                "text": (
                                    '{"recommendation":"buy","confidence":"high",'
                                    '"summary":"The price is below your target.",'
                                    '"reasons":["The latest recorded price is the lowest in the supplied history."]}'
                                ),
                            }
                        ],
                    }
                ],
            },
        )

    async with httpx.AsyncClient(transport=httpx.MockTransport(respond)) as client:
        advice = await generate_product_advice(FakeSession(), tracked_item(), client=client)

    assert advice.recommendation == "buy"
    assert advice.confidence == "high"
    assert "not financial advice" in advice.disclaimer
