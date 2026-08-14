from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
import jwt

from app.core.exceptions import ApplicationError
from app.core.config import settings
from app.core.security import (
    TokenValidationError,
    create_access_token,
    create_password_reset_token,
    decode_password_reset_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.schemas.user import UserRegister
from app.services.email import send_password_reset_email


INVALID_CREDENTIALS = "Invalid email or password"


async def get_user_by_email(session: AsyncSession, email: str) -> User | None:
    result = await session.execute(select(User).where(User.email == email.lower()))
    return result.scalar_one_or_none()


async def get_user_by_id(session: AsyncSession, user_id: int) -> User | None:
    return await session.get(User, user_id)


async def register_user(session: AsyncSession, payload: UserRegister) -> User:
    if await get_user_by_email(session, payload.email):
        raise ApplicationError(
            "An account with this email already exists",
            status_code=409,
        )

    user = User(
        full_name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        phone=payload.phone or None,
        role="user",
    )
    session.add(user)
    try:
        await session.commit()
    except IntegrityError as error:
        await session.rollback()
        raise ApplicationError(
            "An account with this email already exists",
            status_code=409,
        ) from error

    await session.refresh(user)
    return user


async def authenticate_user(session: AsyncSession, email: str, password: str) -> User:
    user = await get_user_by_email(session, email)
    if user is None or not verify_password(password, user.password_hash):
        raise ApplicationError(INVALID_CREDENTIALS, status_code=401)
    if not user.is_active:
        raise ApplicationError("Account is disabled", status_code=403)
    return user


def issue_user_token(user: User) -> str:
    return create_access_token(user.user_id, {"email": user.email, "role": user.role})


async def request_password_reset(session: AsyncSession, email: str) -> None:
    user = await get_user_by_email(session, email)
    if user is None or not user.is_active:
        return
    token = create_password_reset_token(user.user_id, user.password_hash)
    reset_url = f"{settings.frontend_url.rstrip('/')}/reset-password?token={token}"
    await send_password_reset_email(user.email, reset_url)


async def reset_password(session: AsyncSession, token: str, password: str) -> None:
    try:
        unverified = jwt.decode(token, options={"verify_signature": False})
        user_id = int(unverified.get("sub", ""))
    except (TypeError, ValueError, AttributeError):
        raise ApplicationError("Invalid or expired password reset link", status_code=400) from None

    user = await get_user_by_id(session, user_id)
    if user is None or not user.is_active:
        raise ApplicationError("Invalid or expired password reset link", status_code=400)
    try:
        decode_password_reset_token(token, user.password_hash)
    except TokenValidationError as error:
        raise ApplicationError(str(error), status_code=400) from error
    user.password_hash = hash_password(password)
    await session.commit()
