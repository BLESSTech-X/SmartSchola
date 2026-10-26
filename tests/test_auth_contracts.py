"""Fast contract tests for SmartSchola authentication schemas."""
import sys
from pathlib import Path

import pytest
from pydantic import ValidationError

BACKEND = Path(__file__).resolve().parents[1] / "backend"
sys.path.insert(0, str(BACKEND))

import schemas  # noqa: E402


def test_login_accepts_email_in_existing_username_field():
    login = schemas.UserLogin(username="teacher@example.com", password="not-a-real-password")
    assert str(login.username) == "teacher@example.com"


def test_login_rejects_non_email_username():
    with pytest.raises(ValidationError):
        schemas.UserLogin(username="teacher", password="some-password")


def test_user_creation_rejects_short_password():
    with pytest.raises(ValidationError):
        schemas.UserCreate(
            email="student@example.com",
            full_name="Synthetic Student",
            password="short",
        )


def test_user_creation_accepts_valid_synthetic_input():
    user = schemas.UserCreate(
        email="student@example.com",
        full_name="Synthetic Student",
        password="a-long-test-password",
    )
    assert user.email == "student@example.com"
    assert user.role == "student"
