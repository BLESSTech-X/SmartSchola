from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from database import get_db
import models, schemas
from auth import get_current_user, require_roles
from sms_service import send_sms

router = APIRouter(prefix="/fees", tags=["fees"])


def _fee_status(amount_due: float, amount_paid: float) -> str:
    if amount_paid >= amount_due:
        return "Paid"
    elif amount_paid > 0:
        return "Partial"
    return "Unpaid"


def _fee_out(fee: models.Fee) -> dict:
    balance = fee.amount_due - fee.amount_paid
    return {
        "id": fee.id,
        "student_id": fee.student_id,
        "term": fee.term,
        "year": fee.year,
        "amount_due": fee.amount_due,
        "amount_paid": fee.amount_paid,
        "balance": round(max(balance, 0), 2),
        "status": _fee_status(fee.amount_due, fee.amount_paid),
        "payment_date": fee.payment_date,
        "payment_method": fee.payment_method,
        "notes": fee.notes,
        "student": {
            "id": fee.student.id,
            "first_name": fee.student.first_name,
            "last_name": fee.student.last_name,
            "grade": fee.student.grade,
            "class_name": fee.student.class_name,
        } if fee.student else None,
    }


@router.get("")
def list_fees(
    term: Optional[int] = None,
    year: Optional[int] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role not in ("admin", "teacher"):
        raise HTTPException(status_code=403, detail="Access denied")

    q = db.query(models.Fee).join(models.Student).filter(models.Student.is_active == True)
    if term:
        q = q.filter(models.Fee.term == term)
    if year:
        q = q.filter(models.Fee.year == year)
    if search:
        pattern = f"%{search}%"
        q = q.filter(
            (models.Student.first_name.ilike(pattern)) |
            (models.Student.last_name.ilike(pattern))
        )

    fees = q.all()

    # Apply status filter in Python since it's computed
    if status:
        fees = [f for f in fees if _fee_status(f.amount_due, f.amount_paid) == status]

    total = len(fees)
    paginated = fees[(page - 1) * per_page: page * per_page]
    return {
        "fees": [_fee_out(f) for f in paginated],
        "total": total,
        "page": page,
        "per_page": per_page,
    }


@router.get("/summary")
def fee_summary(user=Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role not in ("admin", "teacher"):
        raise HTTPException(status_code=403, detail="Access denied")
    fees = db.query(models.Fee).all()
    total_due = sum(f.amount_due for f in fees)
    total_collected = sum(f.amount_paid for f in fees)
    outstanding = sum(max(f.amount_due - f.amount_paid, 0) for f in fees)
    return {
        "total_due": round(total_due, 2),
        "total_collected": round(total_collected, 2),
        "outstanding": round(outstanding, 2),
        "record_count": len(fees),
    }


@router.post("")
def create_fee(
    req: schemas.FeeCreate,
    user=Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    student = db.query(models.Student).filter_by(id=req.student_id, is_active=True).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    fee = models.Fee(**req.model_dump())
    db.add(fee)
    log = models.ActivityLog(user_id=user.id, action=f"Added fee record for {student.first_name} {student.last_name}")
    db.add(log)
    db.commit()
    db.refresh(fee)
    return _fee_out(fee)


@router.put("/{fee_id}")
def update_fee(
    fee_id: int,
    req: schemas.FeeUpdate,
    user=Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    fee = db.query(models.Fee).filter_by(id=fee_id).first()
    if not fee:
        raise HTTPException(status_code=404, detail="Fee record not found")
    for k, v in req.model_dump(exclude_none=True).items():
        setattr(fee, k, v)
    db.commit()
    db.refresh(fee)
    return _fee_out(fee)


@router.delete("/{fee_id}")
def delete_fee(
    fee_id: int,
    user=Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    fee = db.query(models.Fee).filter_by(id=fee_id).first()
    if not fee:
        raise HTTPException(status_code=404, detail="Fee record not found")
    db.delete(fee)
    db.commit()
    return {"message": "Fee record deleted"}


@router.post("/send-reminders")
def send_reminders(user=Depends(require_roles("admin")), db: Session = Depends(get_db)):
    school = db.query(models.School).first()
    cfg = {
        "sms_provider": school.sms_provider if school else "africas_talking",
        "sms_api_key": school.sms_api_key if school else "",
        "sms_username": school.sms_username if school else "",
        "sms_sender_id": school.sms_sender_id if school else "",
    }

    fees = db.query(models.Fee).join(models.Student).filter(models.Student.is_active == True).all()
    defaulters = [f for f in fees if f.amount_due - f.amount_paid > 0]

    sent = 0
    failed = 0
    for fee in defaulters:
        student = fee.student
        if not student or not student.parent_phone:
            continue
        balance = fee.amount_due - fee.amount_paid
        msg = (
            f"Dear Parent, {student.first_name} {student.last_name} has an outstanding "
            f"fee balance of K{balance:.2f} for Term {fee.term}, {fee.year}. "
            f"Please visit {school.name if school else 'the school'} to settle this balance."
        )
        result = send_sms(student.parent_phone, msg, cfg)
        log = models.SmsLog(
            recipient_phone=student.parent_phone,
            recipient_name=f"Parent of {student.first_name}",
            message=msg,
            provider=result.get("provider", "unknown"),
            status=result.get("status", "failed"),
        )
        db.add(log)
        if result.get("status") in ("delivered", "logged"):
            sent += 1
        else:
            failed += 1

    db.commit()
    return {"sent": sent, "failed": failed}
