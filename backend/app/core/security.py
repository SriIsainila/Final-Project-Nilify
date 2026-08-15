from datetime import UTC, datetime, timedelta
from typing import Any
import hashlib
import hmac

import bcrypt
import jwt
from jwt import InvalidTokenError

from app.core.config import settings


class TokenValidationError(ValueError):
    """Raised when a JWT cannot be verified."""


def hash_password(password: str) -> str:
    encoded = password.encode("utf-8")
    if len(encoded) > 72:
        raise ValueError("Password must not exceed 72 UTF-8 bytes")
    return bcrypt.hashpw(encoded, bcrypt.gensalt(rounds=12)).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except (TypeError, ValueError):
        return False


def create_access_token(subject: str | int, extra_claims: dict[str, Any] | None = None) -> str:
    now = datetime.now(UTC)
    payload: dict[str, Any] = {
        "sub": str(subject),
        "type": "access",
        "iat": now,
        "exp": now + timedelta(minutes=settings.jwt_expire_minutes),
    }
    if extra_claims:
        payload.update(extra_claims)
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict[str, Any]:
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
            options={"require": ["sub", "iat", "exp", "type"]},
        )
    except InvalidTokenError as error:
        raise TokenValidationError("Invalid or expired access token") from error

    if payload.get("type") != "access":
        raise TokenValidationError("Invalid token type")
    return payload


def create_password_reset_token(user_id: int, password_hash: str) -> str:
    now = datetime.now(UTC)
    fingerprint = hashlib.sha256(password_hash.encode("utf-8")).hexdigest()[:24]
    return jwt.encode(
        {
            "sub": str(user_id),
            "type": "password_reset",
            "pwd": fingerprint,
            "iat": now,
            "exp": now + timedelta(minutes=settings.password_reset_expire_minutes),
        },
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )


def decode_password_reset_token(token: str, password_hash: str) -> int:
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
            options={"require": ["sub", "iat", "exp", "type", "pwd"]},
        )
    except InvalidTokenError as error:
        raise TokenValidationError("Invalid or expired password reset link") from error
    expected = hashlib.sha256(password_hash.encode("utf-8")).hexdigest()[:24]
    if payload.get("type") != "password_reset" or not hmac.compare_digest(
        str(payload.get("pwd", "")), expected
    ):
        raise TokenValidationError("Invalid or already used password reset link")
    try:
        return int(payload["sub"])
    except (TypeError, ValueError) as error:
        raise TokenValidationError("Invalid password reset link") from error
