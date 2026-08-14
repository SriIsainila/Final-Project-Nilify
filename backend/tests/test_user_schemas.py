import pytest
from pydantic import ValidationError

from app.schemas.user import UserLogin, UserRegister


@pytest.mark.parametrize("password", ["a", "1", "letters", "12345678", "password1"])
@pytest.mark.parametrize("schema", [UserRegister, UserLogin])
def test_password_accepts_any_character_types(schema, password: str) -> None:
    data = {"email": "user@example.com", "password": password}
    if schema is UserRegister:
        data["name"] = "Test User"

    assert schema(**data).password == password


@pytest.mark.parametrize("schema", [UserRegister, UserLogin])
def test_password_rejects_empty_value(schema) -> None:
    data = {"email": "user@example.com", "password": ""}
    if schema is UserRegister:
        data["name"] = "Test User"

    with pytest.raises(ValidationError):
        schema(**data)
