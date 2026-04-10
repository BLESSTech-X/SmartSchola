from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta

# Relative imports: The '..' tells Python to look in the folder ABOVE this one
from .. import models, schemas, auth_utils
from ..database import get_db

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)