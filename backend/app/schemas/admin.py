from pydantic import BaseModel, Field


class AdminDashboardStats(BaseModel):
    total_users: int = Field(ge=0)
    active_subscriptions: int = Field(ge=0)
    tracked_products: int = Field(ge=0)
    notifications: int = Field(ge=0)
