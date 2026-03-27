from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
from auth import get_current_user, require_roles

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("")
def get_settings(user=Depends(get_current_user), db: Session = Depends(get_db)):
    school = db.query(models.School).first()
    if not school:
        return {}
    return schemas.SchoolOut.model_validate(school)


@router.put("")
def update_settings(
    req: schemas.SchoolUpdate,
    user=Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    school = db.query(models.School).first()
    if not school:
        school = models.School()
        db.add(school)

    for k, v in req.model_dump(exclude_none=True).items():
        setattr(school, k, v)

    log = models.ActivityLog(user_id=user.id, action="Updated school settings")
    db.add(log)
    db.commit()
    db.refresh(school)
    return schemas.SchoolOut.model_validate(school)
