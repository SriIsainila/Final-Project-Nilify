import argparse
import asyncio

from sqlalchemy import select

from app.database import AsyncSessionFactory, engine
from app.models.user import User


async def promote(email: str) -> int:
    normalized_email = email.strip().lower()
    async with AsyncSessionFactory() as session:
        user = await session.scalar(select(User).where(User.email == normalized_email))
        if user is None:
            print(f"No user exists with email: {normalized_email}")
            return 1
        if user.role == "admin":
            print(f"User is already an admin: {normalized_email}")
            return 0
        user.role = "admin"
        await session.commit()
        print(f"Promoted user to admin: {normalized_email}")
        return 0


async def main() -> int:
    parser = argparse.ArgumentParser(description="Promote an existing Nilify user to admin.")
    parser.add_argument("email", help="Email of an existing registered user")
    parser.add_argument("--confirm", action="store_true", help="Confirm the privileged role change")
    args = parser.parse_args()
    if not args.confirm:
        parser.error("Pass --confirm to approve this privileged role change")
    try:
        return await promote(args.email)
    finally:
        await engine.dispose()


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
