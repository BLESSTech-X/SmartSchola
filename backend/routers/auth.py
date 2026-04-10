from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import jose.jwt as jwt
from passlib.context import CryptContext
import os

# Absolute imports for the Normal State
from database import get_db
import models

router = APIRouter()

# Security Config
SECRET_KEY = os.getenv("SECRET_KEY", "BTX26")
ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # 1. Find User
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    
    # 2. Verify Password
    if not pwd_context.verify(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    
    # 3. Create Token
    access_token = jwt.encode(
        {"sub": user.username, "role": user.role, "exp": datetime.utcnow() + timedelta(hours=24)},
        SECRET_KEY, 
        algorithm=ALGORITHM
    )
    
    return {"access_token": access_token, "token_type": "bearer", "role": user.role}