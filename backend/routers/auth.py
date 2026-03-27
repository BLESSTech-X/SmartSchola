from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
from auth import (
    check_password, hash_password, create_access_token,
    get_current_user, require_roles
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=schemas.TokenResponse)
def login(req: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == req.username).first()
    if not user or not check_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    if not user.is_active:
        raise HTTPException(status_code=401, detail="Account is not active. Awaiting admin approval.")
    if user.role == "teacher":
        profile = db.query(models.TeacherProfile).filter_by(user_id=user.id).first()
        if not profile or profile.approval_status != "approved":
            raise HTTPException(status_code=401, detail="Teacher account pending approval.")
    token = create_access_token({"sub": user.username})
    return {"access_token": token, "token_type": "bearer"}


@router.post("/parent-login", response_model=schemas.TokenResponse)
def parent_login(req: schemas.ParentLoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == req.phone).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid phone or PIN")
    profile = db.query(models.ParentProfile).filter_by(user_id=user.id).first()
    if not profile:
        raise HTTPException(status_code=401, detail="Parent profile not found")
    if profile.approval_status != "approved":
        raise HTTPException(status_code=401, detail="Account pending admin approval")
    if not user.is_active:
        raise HTTPException(status_code=401, detail="Account is not active")
    if not check_password(req.pin, profile.hashed_pin):
        raise HTTPException(status_code=401, detail="Invalid phone or PIN")
    token = create_access_token({"sub": user.username})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me")
def me(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    school = db.query(models.School).first()
    data = {
        "id": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "role": user.role,
        "school_name": school.name if school else "Smart Schola",
    }
    if user.role == "teacher":
        profile = db.query(models.TeacherProfile).filter_by(user_id=user.id).first()
        if profile:
            data["classes_assigned"] = profile.classes_assigned
            data["subjects_taught"] = profile.subjects_taught
    return data


@router.post("/change-password")
def change_password(
    req: schemas.ChangePasswordRequest,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not check_password(req.current_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    user.hashed_password = hash_password(req.new_password)
    db.commit()
    return {"message": "Password changed successfully"}
