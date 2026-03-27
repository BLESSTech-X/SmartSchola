from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
from auth import require_roles
from sms_service import send_sms

router = APIRouter(prefix="/sms", tags=["sms"])


@router.post("/send")
def send(
    req: schemas.SmsSendRequest,
    user=Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    school = db.query(models.School).first()
    cfg = {
        "sms_provider": school.sms_provider if school else "africas_talking",
        "sms_api_key": school.sms_api_key if school else "",
        "sms_username": school.sms_username if school else "",
        "sms_sender_id": school.sms_sender_id if school else "",
    }

    phones = []

    if req.recipients == "all_parents":
        students = db.query(models.Student).filter_by(is_active=True).all()
        phones = [(s.parent_phone, f"Parent of {s.first_name}") for s in students if s.parent_phone]

    elif req.recipients == "fee_defaulters":
        fees = db.query(models.Fee).join(models.Student).filter(models.Student.is_active == True).all()
        phones = [
            (f.student.parent_phone, f"Parent of {f.student.first_name}")
            for f in fees
            if f.student and f.student.parent_phone and (f.amount_due - f.amount_paid) > 0
        ]

    elif req.recipients.startswith("class_"):
        class_name = req.class_name or req.recipients.replace("class_", "")
        students = db.query(models.Student).filter_by(class_name=class_name, is_active=True).all()
        phones = [(s.parent_phone, f"Parent of {s.first_name}") for s in students if s.parent_phone]

    elif req.recipients == "custom" and req.custom_phone:
        phones = [(req.custom_phone, "Custom Recipient")]

    sent = 0
    failed = 0
    for phone, name in phones:
        result = send_sms(phone, req.message, cfg)
        log = models.SmsLog(
            recipient_phone=phone,
            recipient_name=name,
            message=req.message,
            provider=result.get("provider", "unknown"),
            status=result.get("status", "failed"),
        )
        db.add(log)
        if result.get("status") in ("delivered", "logged"):
            sent += 1
        else:
            failed += 1

    db.commit()
    return {"sent": sent, "failed": failed, "total": len(phones)}


@router.get("/log")
def sms_log(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    user=Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    q = db.query(models.SmsLog).order_by(models.SmsLog.sent_at.desc())
    total = q.count()
    logs = q.offset((page - 1) * per_page).limit(per_page).all()
    return {
        "logs": [schemas.SmsLogOut.model_validate(l) for l in logs],
        "total": total,
        "page": page,
        "per_page": per_page,
    }
