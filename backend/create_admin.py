"""Provision an initial administrator without embedding credentials in source.

Run from the backend directory after configuring DATABASE_URL, ADMIN_EMAIL,
ADMIN_FULL_NAME, and ADMIN_INITIAL_PASSWORD in a private environment.
"""
import os
import sys

from sqlalchemy.orm import sessionmaker

import auth_utils
import models
from database import engine


def create_admin() -> int:
    email = os.getenv("ADMIN_EMAIL", "").strip().lower()
    full_name = os.getenv("ADMIN_FULL_NAME", "").strip()
    password = os.getenv("ADMIN_INITIAL_PASSWORD", "")

    if not email or not full_name or not password:
        print(
            "Missing required environment variables: ADMIN_EMAIL, "
            "ADMIN_FULL_NAME, ADMIN_INITIAL_PASSWORD.",
            file=sys.stderr,
        )
        return 2
    if len(password) < 12:
        print("ADMIN_INITIAL_PASSWORD must contain at least 12 characters.", file=sys.stderr)
        return 2

    db = sessionmaker(bind=engine)()
    try:
        existing = db.query(models.User).filter(models.User.email == email).first()
        if existing:
            print("An account with ADMIN_EMAIL already exists; no changes made.")
            return 1

        user = models.User(
            email=email,
            hashed_password=auth_utils.get_password_hash(password),
            full_name=full_name,
            role="admin",
            is_active=True,
        )
        db.add(user)
        db.commit()
        print(f"Administrator account created for {email}. Do not share its password.")
        return 0
    except Exception as exc:
        db.rollback()
        print(f"Administrator provisioning failed: {type(exc).__name__}", file=sys.stderr)
        return 1
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(create_admin())
