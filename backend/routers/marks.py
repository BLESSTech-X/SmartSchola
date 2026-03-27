from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
import models, schemas
from auth import get_current_user, require_roles
import grading

router = APIRouter(prefix="/marks", tags=["marks"])


@router.post("/bulk", response_model=schemas.BulkMarkResponse)
def bulk_marks(
    req: schemas.BulkMarkRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role not in ("admin", "teacher"):
        raise HTTPException(status_code=403, detail="Access denied")

    # Get teacher's allowed classes
    allowed_classes = None
    if user.role == "teacher":
        profile = db.query(models.TeacherProfile).filter_by(user_id=user.id).first()
        if profile and profile.classes_assigned:
            allowed_classes = [c.strip() for c in profile.classes_assigned.split(",")]

    saved = 0
    updated = 0
    flagged = []

    for m in req.marks:
        if not (0 <= m.score <= 100):
            continue

        student = db.query(models.Student).filter_by(id=m.student_id, is_active=True).first()
        if not student:
            continue

        if allowed_classes is not None and student.class_name not in allowed_classes:
            continue

        subject = db.query(models.Subject).filter_by(id=m.subject_id, is_active=True).first()
        if not subject:
            continue

        grade = grading.ecz_grade(m.score)
        rmk = grading.remark(m.score, subject.name)
        anomaly = grading.is_anomaly(m.score, m.student_id, m.subject_id, db)

        if anomaly:
            flagged.append(f"{student.first_name} {student.last_name}")

        existing = (
            db.query(models.Mark)
            .filter_by(student_id=m.student_id, subject_id=m.subject_id, term=m.term, year=m.year)
            .first()
        )
        if existing:
            existing.score = m.score
            existing.ecz_grade = grade
            existing.ai_remark = rmk
            existing.verify_required = anomaly
            existing.entered_by = user.id
            updated += 1
        else:
            new_mark = models.Mark(
                student_id=m.student_id,
                subject_id=m.subject_id,
                term=m.term,
                year=m.year,
                score=m.score,
                ecz_grade=grade,
                ai_remark=rmk,
                verify_required=anomaly,
                entered_by=user.id,
            )
            db.add(new_mark)
            saved += 1

    db.commit()
    return schemas.BulkMarkResponse(saved=saved, updated=updated, flagged=flagged)


@router.get("/{student_id}")
def get_marks(
    student_id: int,
    term: Optional[int] = None,
    year: Optional[int] = None,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role not in ("admin", "teacher"):
        raise HTTPException(status_code=403, detail="Access denied")

    q = db.query(models.Mark).filter_by(student_id=student_id)
    if term:
        q = q.filter_by(term=term)
    if year:
        q = q.filter_by(year=year)

    marks = q.all()
    result = []
    for m in marks:
        result.append({
            "id": m.id,
            "student_id": m.student_id,
            "subject_id": m.subject_id,
            "subject": {"id": m.subject.id, "name": m.subject.name, "code": m.subject.code} if m.subject else None,
            "term": m.term,
            "year": m.year,
            "score": m.score,
            "ecz_grade": m.ecz_grade,
            "ai_remark": m.ai_remark,
            "verify_required": m.verify_required,
        })
    return result


@router.delete("/{mark_id}")
def delete_mark(
    mark_id: int,
    user=Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    mark = db.query(models.Mark).filter_by(id=mark_id).first()
    if not mark:
        raise HTTPException(status_code=404, detail="Mark not found")
    db.delete(mark)
    db.commit()
    return {"message": "Mark deleted"}
