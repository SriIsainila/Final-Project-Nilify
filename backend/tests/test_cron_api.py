from types import SimpleNamespace

import pytest
from httpx import ASGITransport, AsyncClient

from app.core.config import settings
from app.main import app
from app.routes import cron


@pytest.mark.asyncio
async def test_cron_requires_secret(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "cron_secret", "")
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/cron/track")
    assert response.status_code == 503


@pytest.mark.asyncio
async def test_cron_authorizes_and_returns_summary(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "cron_secret", "test-cron-secret")

    async def fake_cycle() -> SimpleNamespace:
        return SimpleNamespace(claimed=3, checked=2, changed=1, notifications=1, failed=1)

    monkeypatch.setattr(cron, "run_scheduler_cycle", fake_cycle)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        denied = await client.get("/api/cron/track", headers={"Authorization": "Bearer wrong"})
        response = await client.get(
            "/api/cron/track",
            headers={"Authorization": "Bearer test-cron-secret"},
        )

    assert denied.status_code == 401
    assert response.status_code == 200
    assert response.json() == {
        "status": "completed",
        "claimed": 3,
        "checked": 2,
        "changed": 1,
        "notifications": 1,
        "failed": 1,
    }
