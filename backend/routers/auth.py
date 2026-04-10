from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext
import os

# Absolute imports
from database import get_db
import models
import schemas

router = APIRouter()

# Security Config
SECRET_KEY = os.getenv("SECRET_KEY", "BTX26")
ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@router.post("/login")
def login(request: schemas.LoginRequest, db: Session = Depends(get_db)):
    # 1. Find User by username
    user = db.query(models.User).filter(models.User.username == request.username).first()
    
    # 2. Verify existence and password
    if not user or not pwd_context.verify(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Incorrect username or password"
        )
    
    # 3. Create JWT Token
    expire = datetime.utcnow() + timedelta(hours=24)
    to_encode = {
        "sub": user.username, 
        "role": user.role, 
        "exp": expire
    }
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    # 4. Return JSON response the frontend expects
    return {
        "access_token": encoded_jwt, 
        "token_type": "bearer", 
        "role": user.role
    }