from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class CatalogProductBase(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    category: str = Field(min_length=2, max_length=80)
    description: str = Field(min_length=2, max_length=2000)
    image_url: str = Field(min_length=1, max_length=500)
    price: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    stock_quantity: int = Field(ge=0, le=1_000_000)
    in_stock: bool
    colour: str = Field(min_length=1, max_length=80)

    @field_validator("name", "category", "description", "image_url", "colour")
    @classmethod
    def strip_text(cls, value: str) -> str:
        return value.strip()


class CatalogProductUpdate(CatalogProductBase):
    pass


class CatalogProductCreate(CatalogProductBase):
    slug: str | None = Field(default=None, min_length=2, max_length=100, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


class CatalogProductRead(CatalogProductBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    slug: str
    product_url: str
    created_at: datetime
    updated_at: datetime


class CatalogProductDeleteResponse(BaseModel):
    message: str
