from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models, auth

router = APIRouter(prefix="/admin-mgmt", tags=["Admin Management"])

# ── 1. LIST ALL PENDING APPLICATIONS ─────────────────────────────────────────
@router.get("/pending-approvals")
def get_pending_approvals(db: Session = Depends(get_db)):
    # Get all teachers and parents waiting for BLESSTechX approval
    teachers = db.query(models.TeacherProfile).filter_by(approval_status="pending").all()
    parents = db.query(models.ParentProfile).filter_by(approval_status="pending").all()
    
    return {
        "pending_teachers": teachers,
        "pending_parents": parents
    }

# ── 2. APPROVE A USER (Teacher or Parent) ────────────────────────────────────
@router.post("/approve/{user_id}")
def approve_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter_by(id=user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Activate the login
    user.is_active = True

    # Update the specific profile status
    if user.role == "teacher":
        profile = db.query(models.TeacherProfile).filter_by(user_id=user_id).first()
        if profile: profile.approval_status = "approved"
    elif user.role == "parent":
        profile = db.query(models.ParentProfile).filter_by(user_id=user_id).first()
        if profile: profile.approval_status = "approved"

    db.commit()
    return {"message": f"User {user.full_name} is now ACTIVE and Approved."}

# ── 3. MANUAL FEE ENTRY (Since we are skipping Mobile Money) ────────────────
@router.post("/record-payment")
def record_manual_payment(student_id: int, amount: float, method: str, db: Session = Depends(get_db)):
    student = db.query(models.Student).filter_by(id=student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Update the student's balance manually
    student.balance += amount

    # Create a record in the Fees table for history
    new_fee = models.Fee(
        student_id=student_id,
        amount_paid=amount,
        amount_due=0, # Adjust based on your school's specific fee structure
        payment_method=method, # e.g., "Cash", "Direct Bank Deposit"
        term=1, # Defaulting to Term 1 2026
        year=2026
    )
    db.add(new_fee)
    db.commit()

    return {"message": f"Payment of K{amount} recorded for {student.first_name}."}