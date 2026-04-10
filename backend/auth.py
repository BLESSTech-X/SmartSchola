from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Any

# ── FLAT IMPORTS ─────────────────────────────────────────────────────────────
# We no longer use ".." because all files are now in the same backend folder.
import models
import schemas
import auth_utils
from database import get_db

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

@router.post("/login", response_model=schemas.Token)
def login(user_credentials: schemas.UserLogin, db: Session = Depends(get_db)) -> Any:
    """
    Authenticates a user and returns a JWT access token.
    Expects JSON body: {"username": "...", "password": "..."}
    """
    # 1. Look for the user in the database
    user = db.query(models.User).filter(
        models.User.username == user_credentials.username
    ).first()

    # 2. Verify user existence and password
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Note: verify_password comes from your auth_utils.py file
    if not auth_utils.verify_password(user_credentials.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. Create the Access Token
    access_token_expires = timedelta(minutes=auth_utils.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth_utils.create_access_token(
        data={"sub": user.username, "role": user.role},
        expires_delta=access_token_expires
    )

    # 4. Return token and user role
    # Including 'role' allows the frontend to redirect to Admin vs Teacher dashboard
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "role": user.role
    }

@router.get("/me", response_model=schemas.UserOut)
def get_current_user_info(
    current_user: models.User = Depends(auth_utils.get_current_user)
):
    """
    Returns the profile of the currently logged-in user.
    """
    return current_user