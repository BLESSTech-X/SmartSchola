"""Fast contract tests for school-scoped SmartSchola authentication schemas."""
import sys
from pathlib import Path

import pytest
from pydantic import ValidationError

BACKEND = Path(__file__).resolve().parents[1] / "backend"
sys.path.insert(0, str(BACKEND))

import schemas  # noqa: E402


def test_login_accepts_email_and_requires_selected_school_and_role():
    login = schemas.UserLogin(
        username="teacher@example.com",
        password="not-a-real-password",
        school_slug="registered-school",
        role="teacher",
    )
    assert login.username == "teacher@example.com"
    assert login.school_slug == "registered-school"
    assert login.role == "teacher"


def test_login_accepts_school_issued_identifier():
    login = schemas.UserLogin(
        username="STU-1042",
        password="not-a-real-password",
        school_slug="registered-school",
        role="student",
    )
    assert login.username == "STU-1042"


def test_login_requires_school_and_role():
    with pytest.raises(ValidationError):
        schemas.UserLogin(username="teacher@example.com", password="not-a-real-password")


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
