import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

import database
import models

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
_ENVIRONMENT = os.getenv("ENVIRONMENT", "development").lower()
_CONFIGURED_SECRET = os.getenv("SECRET_KEY")

if _ENVIRONMENT == "production":
    if not _CONFIGURED_SECRET or len(_CONFIGURED_SECRET) < 32:
        raise RuntimeError("Production requires SECRET_KEY with at least 32 characters.")
    SECRET_KEY = _CONFIGURED_SECRET
else:
    # Local-only ephemeral key. Tokens are invalidated whenever the process restarts.
    SECRET_KEY = _CONFIGURED_SECRET or secrets.token_urlsafe(48)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except (ValueError, TypeError):
        return False


def get_password_hash(password: str) -> str:
    if not password or len(password) < 10:
        raise ValueError("Passwords must contain at least 10 characters.")
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    to_encode.update({
        "iat": now,
        "exp": now + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)),
    })
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(database.get_db),
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        subject = payload.get("sub")
        if not isinstance(subject, str) or not subject:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.email == subject).first()
    if user is None or not user.is_active:
        raise credentials_exception

    # Every authenticated session must remain bound to an active, explicitly authorised school.
    # Legacy tokens without school claims are intentionally rejected.
    school_id = payload.get("school_id")
    school_slug = payload.get("school_slug")
    token_role = payload.get("role")
    if not isinstance(school_id, int) or not isinstance(school_slug, str) or not school_slug:
        raise credentials_exception
    school = db.query(models.School).filter(
        models.School.id == school_id,
        models.School.slug == school_slug,
        models.School.is_active.is_(True),
    ).first()
    membership = db.query(models.SchoolMembership).filter_by(
        school_id=school_id,
        user_id=user.id,
        is_authorized=True,
    ).first()
    if school is None or membership is None or membership.role.lower() != str(token_role or "").lower():
        raise credentials_exception

    # Attach verified tenant context for route-level authorization and response schemas.
    user.school_id = school.id
    user.school_slug = school.slug
    user.school_name = school.name
    user.role = membership.role
    return user
