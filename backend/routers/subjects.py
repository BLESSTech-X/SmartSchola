from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
from auth import require_roles

router = APIRouter(prefix="/subjects", tags=["subjects"])


@router.get("")
def list_subjects(db: Session = Depends(get_db)):
    subjects = db.query(models.Subject).filter_by(is_active=True).all()
    return [schemas.SubjectOut.model_validate(s) for s in subjects]


@router.post("")
def create_subject(
    req: schemas.SubjectCreate,
    user=Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    subject = models.Subject(**req.model_dump())
    db.add(subject)
    log = models.ActivityLog(user_id=user.id, action=f"Added subject: {req.name}")
    db.add(log)
    db.commit()
    db.refresh(subject)
    return schemas.SubjectOut.model_validate(subject)


@router.delete("/{subject_id}")
def delete_subject(
    subject_id: int,
    user=Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    subject = db.query(models.Subject).filter_by(id=subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    subject.is_active = False
    log = models.ActivityLog(user_id=user.id, action=f"Removed subject: {subject.name}")
    db.add(log)
    db.commit()
    return {"message": "Subject removed"}
