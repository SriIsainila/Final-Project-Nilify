from fastapi import APIRouter

from app.routes.admin import router as admin_router
from app.routes.auth import router as auth_router
from app.routes.billing import router as billing_router
from app.routes.notifications import router as notifications_router
from app.routes.payments import router as payments_router
from app.routes.products import router as products_router
from app.routes.catalog import router as catalog_router

api_router = APIRouter()
api_router.include_router(admin_router)
api_router.include_router(catalog_router)
api_router.include_router(auth_router)
api_router.include_router(billing_router)
api_router.include_router(payments_router)
api_router.include_router(products_router)
api_router.include_router(notifications_router)
