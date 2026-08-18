from functools import lru_cache
from pathlib import Path
from typing import Literal
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from pydantic import AliasChoices, Field, computed_field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        env_prefix="NILIFY_",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "Nilify API"
    app_env: Literal["development", "test", "production"] = "development"
    debug: bool = False
    api_prefix: str = "/api"
    host: str = "127.0.0.1"
    port: int = Field(default=8000, ge=1, le=65535)

    database_url: str
    database_echo: bool = False
    database_connect_timeout_seconds: float = Field(default=5.0, ge=1, le=60)

    jwt_secret: str = Field(min_length=32)
    jwt_algorithm: Literal["HS256", "HS384", "HS512"] = "HS256"
    jwt_expire_minutes: int = Field(default=10080, ge=1)
    auth_cookie_name: str = "nilify_access_token"
    auth_cookie_secure: bool = False
    auth_cookie_samesite: Literal["lax", "strict", "none"] = "lax"

    frontend_origins: str = "http://localhost:5173"

    scheduler_enabled: bool = True
    tracker_interval_minutes: int = Field(
        default=1,
        ge=1,
        validation_alias="TRACKER_INTERVAL_MINUTES",
    )
    scheduler_batch_size: int = Field(default=50, ge=1, le=500)
    scheduler_concurrency: int = Field(default=5, ge=1, le=20)
    cron_secret: str = Field(
        default="",
        validation_alias=AliasChoices("CRON_SECRET", "NILIFY_CRON_SECRET"),
    )

    scraper_timeout_seconds: float = Field(default=15.0, ge=1, le=60)
    scraper_max_bytes: int = Field(default=5_000_000, ge=10_000, le=20_000_000)
    scraper_max_redirects: int = Field(default=3, ge=0, le=10)
    scraper_user_agent: str = "NilifyPriceMonitor/1.0"

    # Empty by default so the core tracking service runs without AI configured.
    gemini_api_key: str = ""
    gemini_model: str = "gemini-3.6-flash"
    gemini_timeout_seconds: float = Field(default=30.0, ge=5, le=120)

    payhere_merchant_id: str = Field(
        default="",
        validation_alias=AliasChoices("PAYHERE_MERCHANT_ID", "NILIFY_PAYHERE_MERCHANT_ID"),
    )
    payhere_merchant_secret: str = Field(
        default="",
        validation_alias=AliasChoices("PAYHERE_MERCHANT_SECRET", "NILIFY_PAYHERE_MERCHANT_SECRET"),
    )
    payhere_sandbox: bool = Field(
        default=True,
        validation_alias=AliasChoices("PAYHERE_SANDBOX", "NILIFY_PAYHERE_SANDBOX"),
    )
    public_backend_url: str = Field(
        default="",
        validation_alias=AliasChoices("PUBLIC_BACKEND_URL", "NILIFY_PUBLIC_BACKEND_URL"),
    )
    frontend_url: str = "http://localhost:5173"

    smtp_host: str = ""
    smtp_port: int = Field(default=587, ge=1, le=65535)
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from_email: str = ""
    smtp_use_tls: bool = True
    password_reset_expire_minutes: int = Field(default=30, ge=5, le=1440)

    @field_validator("database_url", mode="before")
    @classmethod
    def use_async_postgres_driver(cls, value: object) -> object:
        """Accept managed-provider PostgreSQL URLs with SQLAlchemy's async engine."""
        if not isinstance(value, str):
            return value
        if value.startswith("postgresql://"):
            value = value.replace("postgresql://", "postgresql+asyncpg://", 1)
        elif value.startswith("postgres://"):
            value = value.replace("postgres://", "postgresql+asyncpg://", 1)

        # Neon provides libpq parameters. asyncpg uses ``ssl`` instead of
        # ``sslmode`` and does not accept ``channel_binding``.
        parts = urlsplit(value)
        query = []
        for key, item in parse_qsl(parts.query, keep_blank_values=True):
            if key == "channel_binding":
                continue
            query.append(("ssl" if key == "sslmode" else key, item))
        return urlunsplit(parts._replace(query=urlencode(query)))

    @computed_field
    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.frontend_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
