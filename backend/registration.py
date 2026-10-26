from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import auth_utils
import database
import models
import schemas

router = APIRouter(prefix="/register", tags=["Registration"])


@router.post("/", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def register_user(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    """Public self-registration creates only a least-privileged student account.

    Staff and administrator accounts must be provisioned through a separately
    authorised workflow. A client-supplied role is never trusted.
    """
    email = user.email.strip().lower()
    existing = db.query(models.User).filter(models.User.email == email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    try:
        hashed_password = auth_utils.get_password_hash(user.password)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc

    new_user = models.User(
        email=email,
        hashed_password=hashed_password,
        full_name=user.full_name.strip(),
        role="student",
        is_active=True,
    )
    db.add(new_user)
    try:
        db.commit()
        db.refresh(new_user)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Unable to create account")

    return new_user
