from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, date
from database import get_db
import models
from auth import get_current_user, require_roles

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats")
def stats(user=Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role not in ("admin", "teacher"):
        return {}

    total_students = db.query(models.Student).filter_by(is_active=True).count()

    fees = db.query(models.Fee).all()
    fees_collected = sum(f.amount_paid for f in fees)
    fees_outstanding = sum(max(f.amount_due - f.amount_paid, 0) for f in fees)

    today_start = datetime.combine(date.today(), datetime.min.time())
    sms_sent_today = db.query(models.SmsLog).filter(models.SmsLog.sent_at >= today_start).count()

    pending_teachers = db.query(models.TeacherProfile).filter_by(approval_status="pending").count()
    pending_parents = db.query(models.ParentProfile).filter_by(approval_status="pending").count()
    pending_approvals = pending_teachers + pending_parents

    recent_activity = (
        db.query(models.ActivityLog)
        .order_by(models.ActivityLog.created_at.desc())
        .limit(10)
        .all()
    )

    return {
        "total_students": total_students,
        "fees_collected": round(fees_collected, 2),
        "fees_outstanding": round(fees_outstanding, 2),
        "sms_sent_today": sms_sent_today,
        "pending_approvals": pending_approvals,
        "recent_activity": [
            {
                "id": a.id,
                "action": a.action,
                "details": a.details,
                "created_at": a.created_at.isoformat(),
                "user_id": a.user_id,
            }
            for a in recent_activity
        ],
    }
