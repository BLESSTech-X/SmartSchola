from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
from auth import hash_password

router = APIRouter(prefix="/register", tags=["registration"])

# ── 1. TEACHER REGISTRATION ──────────────────────────────────────────────────
@router.post("/teacher")
def register_teacher(req: schemas.TeacherRegisterRequest, db: Session = Depends(get_db)):
    # Basic Validation
    if len(req.full_name) < 3:
        raise HTTPException(status_code=400, detail="Full name must be at least 3 characters")
    if len(req.username) < 4:
        raise HTTPException(status_code=400, detail="Username must be at least 4 characters")
    if len(req.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    
    # Check if user already exists
    if db.query(models.User).filter_by(username=req.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    # Create the Base User (LOCKED/INACTIVE by default)
    user = models.User(
        username=req.username,
        full_name=req.full_name,
        role="teacher",
        hashed_password=hash_password(req.password),
        is_active=False,
    )
    db.add(user)
    db.flush() # Gets the user.id for the profile

    # Create the Teacher Profile
    profile = models.TeacherProfile(
        user_id=user.id,
        phone=req.phone,
        bio=req.bio,
        approval_status="pending",
    )
    db.add(profile)

    # Log the Activity
    log = models.ActivityLog(
        action="Registration",
        details={"type": "teacher", "name": req.full_name, "username": req.username}
    )
    db.add(log)

    db.commit()
    return {"message": "Registration submitted. Awaiting BLESSTech-X admin approval."}

# ── 2. PARENT REGISTRATION ───────────────────────────────────────────────────
@router.post("/parent")
def register_parent(req: schemas.ParentRegisterRequest, db: Session = Depends(get_db)):
    # Verify student exists in Zambian school records
    student = db.query(models.Student).filter_by(id=req.student_id, is_active=True).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found or inactive")
    
    # Check if phone number is already a username
    if db.query(models.User).filter_by(username=req.phone).first():
        raise HTTPException(status_code=400, detail="Phone number already registered")
    
    # Validate 6-digit PIN for Parent Portal access
    if len(req.pin) != 6 or not req.pin.isdigit():
        raise HTTPException(status_code=400, detail="PIN must be exactly 6 digits")

    # Create Parent User (Locked until Admin verify)
    user = models.User(
        username=req.phone,
        full_name=req.full_name,
        role="parent",
        hashed_password=hash_password(req.pin),
        is_active=False,
    )
    db.add(user)
    db.flush()

    # Create Parent Profile linked to Student
    profile = models.ParentProfile(
        user_id=user.id,
        student_id=req.student_id,
        relationship_to_student=req.relationship_to_student,
        phone=req.phone,
        hashed_pin=hash_password(req.pin),
        approval_status="pending",
    )
    db.add(profile)

    # Log the Activity
    log = models.ActivityLog(
        action="Registration",
        details={
            "type": "parent", 
            "parent_name": req.full_name, 
            "student": f"{student.first_name} {student.last_name}"
        }
    )
    db.add(log)

    db.commit()
    return {"message": "Registration submitted. Awaiting admin approval."}

# ── 3. AVAILABILITY CHECKS (Utility Routes) ──────────────────────────────────
@router.get("/check-username/{username}")
def check_username(username: str, db: Session = Depends(get_db)):
    taken = db.query(models.User).filter_by(username=username).first() is not None
    return {"available": not taken}

@router.get("/check-phone/{phone}")
def check_phone(phone: str, db: Session = Depends(get_db)):
    taken = db.query(models.User).filter_by(username=phone).first() is not None
    return {"available": not taken}