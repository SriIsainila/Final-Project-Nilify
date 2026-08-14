from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.models.catalog_product import CatalogProduct
from app.routes.admin import product_read
from app.routes.dependencies import DatabaseSession
from app.schemas.catalog_product import CatalogProductRead

router = APIRouter(prefix="/catalog", tags=["Public catalog"])


@router.get("/products/{slug}", response_model=CatalogProductRead)
async def public_product(slug: str, session: DatabaseSession) -> CatalogProductRead:
    product = await session.scalar(select(CatalogProduct).where(CatalogProduct.slug == slug))
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product_read(product)
