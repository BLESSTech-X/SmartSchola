import os
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from database import get_db
import models

# ── CONFIGURATION ──────────────────────────────────────────────────────────
# Using a shorter fallback to avoid Bcrypt 72-byte overhead
SECRET_KEY = os.getenv("SECRET_KEY", "BTX26")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))

# Single shared CryptContext with explicit truncation error suppression
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__truncate_error=False)

security = HTTPBearer()

# ── HASHING UTILITIES ──────────────────────────────────────────────────────
def hash_password(password: str) -> str:
    # We only take the first 50 chars to leave room for the secret key
    return pwd_context.hash(password[:50])

def check_password(plain: str, hashed: str) -> bool:
    # Must match the 50 char limit above
    return pwd_context.verify(plain[:50], hashed)


# ── JWT & AUTH ─────────────────────────────────────────────────────────────
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode["exp"] = expire
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None or not user.is_active:
        raise credentials_exception
    return user


def get_current_parent(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> models.User:
    user = get_current_user(credentials, db)
    if user.role != "parent":
        raise HTTPException(status_code=403, detail="Parent access only")
    profile = db.query(models.ParentProfile).filter(
        models.ParentProfile.user_id == user.id
    ).first()
    if not profile or profile.approval_status != "approved":
        raise HTTPException(status_code=403, detail="Parent account not approved")
    return user


def require_roles(*roles):
    def dependency(
        credentials: HTTPAuthorizationCredentials = Depends(security),
        db: Session = Depends(get_db)
    ) -> models.User:
        user = get_current_user(credentials, db)
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(roles)}"
            )
        return user
    return dependency