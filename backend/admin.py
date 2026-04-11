from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import models, schemas, database, auth_utils

router = APIRouter(
    prefix="/admin",
    tags=["Admin Management"]
)

# A simple check to ensure the admin is authorized
def get_current_admin(current_user: models.User = Depends(auth_utils.get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have administrative privileges"
        )
    return current_user

@router.get("/users", response_model=List[schemas.UserOut])
def get_all_users(
    db: Session = Depends(database.get_db), 
    admin: models.User = Depends(get_current_admin)
):
    """Admin-only route to view all registered users."""
    return db.query(models.User).all()