from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
from auth import hash_password

router = APIRouter(prefix="/register", tags=["registration"])


@router.post("/teacher")
def register_teacher(req: schemas.TeacherRegisterRequest, db: Session = Depends(get_db)):
    if len(req.full_name) < 3:
        raise HTTPException(status_code=400, detail="Full name must be at least 3 characters")
    if len(req.username) < 4:
        raise HTTPException(status_code=400, detail="Username must be at least 4 characters")
    if len(req.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    if db.query(models.User).filter_by(username=req.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    user = models.User(
        username=req.username,
        full_name=req.full_name,
        role="teacher",
        hashed_password=hash_password(req.password),
        is_active=False,
    )
    db.add(user)
    db.flush()

    profile = models.TeacherProfile(
        user_id=user.id,
        phone=req.phone,
        bio=req.bio,
        approval_status="pending",
    )
    db.add(profile)

    log = models.ActivityLog(action=f"New teacher registration: {req.full_name} (@{req.username})")
    db.add(log)

    db.commit()
    return {"message": "Registration submitted. Awaiting admin approval."}


@router.post("/parent")
def register_parent(req: schemas.ParentRegisterRequest, db: Session = Depends(get_db)):
    student = db.query(models.Student).filter_by(id=req.student_id, is_active=True).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    if db.query(models.User).filter_by(username=req.phone).first():
        raise HTTPException(status_code=400, detail="Phone number already registered")
    if len(req.pin) != 6 or not req.pin.isdigit():
        raise HTTPException(status_code=400, detail="PIN must be exactly 6 digits")

    user = models.User(
        username=req.phone,
        full_name=req.full_name,
        role="parent",
        hashed_password=hash_password(req.pin),
        is_active=False,
    )
    db.add(user)
    db.flush()

    profile = models.ParentProfile(
        user_id=user.id,
        student_id=req.student_id,
        relationship_to_student=req.relationship_to_student,
        phone=req.phone,
        hashed_pin=hash_password(req.pin),
        approval_status="pending",
    )
    db.add(profile)

    log = models.ActivityLog(action=f"New parent registration: {req.full_name} for student {student.first_name} {student.last_name}")
    db.add(log)

    db.commit()
    return {"message": "Registration submitted. Awaiting admin approval."}


@router.get("/check-username/{username}")
def check_username(username: str, db: Session = Depends(get_db)):
    taken = db.query(models.User).filter_by(username=username).first() is not None
    return {"available": not taken}


@router.get("/check-phone/{phone}")
def check_phone(phone: str, db: Session = Depends(get_db)):
    taken = db.query(models.User).filter_by(username=phone).first() is not None
    return {"available": not taken}
