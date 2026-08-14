from typing import Literal

from pydantic import BaseModel, Field


class ProductAdvice(BaseModel):
    recommendation: Literal["buy", "wait", "watch"]
    confidence: Literal["low", "medium", "high"]
    summary: str = Field(min_length=1, max_length=300)
    reasons: list[str] = Field(min_length=1, max_length=3)
    disclaimer: str = "AI-generated guidance based only on tracked price data, not financial advice."
