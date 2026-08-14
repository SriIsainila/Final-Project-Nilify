from types import SimpleNamespace

import pytest

from app.core.exceptions import ApplicationError
from app.core.security import decode_access_token
from app.routes.dependencies import require_admin, require_normal_user
from app.schemas.user import UserRead, UserRegister
from app.services.auth import issue_user_token


def user(role: str = "user") -> SimpleNamespace:
    return SimpleNamespace(
        user_id=7,
        full_name="Role Test",
        email="role@example.com",
        phone=None,
        role=role,
        created_at=None,
    )


def test_registration_schema_has_no_role_input() -> None:
    payload = UserRegister(name="Role Test", email="role@example.com", password="password")
    assert "role" not in payload.model_fields_set
    assert not hasattr(payload, "role")


def test_authenticated_user_response_and_jwt_include_role() -> None:
    admin = user("admin")
    assert UserRead.from_user(admin).role == "admin"
    assert decode_access_token(issue_user_token(admin))["role"] == "admin"


@pytest.mark.asyncio
async def test_role_dependencies_return_403_for_wrong_role() -> None:
    normal = user("user")
    admin = user("admin")
    assert await require_normal_user(normal) is normal
    assert await require_admin(admin) is admin

    with pytest.raises(ApplicationError) as user_error:
        await require_admin(normal)
    assert user_error.value.status_code == 403

    with pytest.raises(ApplicationError) as admin_error:
        await require_normal_user(admin)
    assert admin_error.value.status_code == 403
