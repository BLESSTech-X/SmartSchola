from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import auth_utils
import models
import schemas
from database import get_db

router = APIRouter(prefix="/schools", tags=["Schools"])


@router.get("/public", response_model=list[schemas.PublicSchool])
def public_schools(db: Session = Depends(get_db)):
    """Return only real, active schools in the registry; preview/demo profiles are never sign-in options."""
    return db.query(models.School).filter(
        models.School.is_active.is_(True)
    ).order_by(models.School.name.asc()).all()


@router.post("/admin/unblock-and-send-reset")
def admin_unblock_and_send_reset(
    payload: schemas.UnblockAccountRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only SmartSchola support administrators can process verified unblock requests.")
    from auth import unblock_and_send_reset
    frontend_base_url = __import__("os").getenv("FRONTEND_BASE_URL", "").strip()
    if not frontend_base_url:
        raise HTTPException(status_code=503, detail="FRONTEND_BASE_URL is not configured; the account remains blocked.")
    unblock_and_send_reset(payload.school_slug, str(payload.user_email), db, frontend_base_url)
    return {"message": "Verification complete. A one-time password-reset link has been sent to the account email."}
