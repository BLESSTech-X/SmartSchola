from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
import models, schemas
from auth import get_current_user, require_roles

router = APIRouter(prefix="/students", tags=["students"])


def _teacher_classes(user, db):
    """Return list of class names a teacher is assigned to, or None for admins."""
    if user.role == "admin":
        return None
    profile = db.query(models.TeacherProfile).filter_by(user_id=user.id).first()
    if profile and profile.classes_assigned:
        return [c.strip() for c in profile.classes_assigned.split(",") if c.strip()]
    return []


@router.get("")
def list_students(
    search: Optional[str] = None,
    grade: Optional[int] = None,
    class_name: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role not in ("admin", "teacher"):
        raise HTTPException(status_code=403, detail="Access denied")

    q = db.query(models.Student).filter_by(is_active=True)

    allowed_classes = _teacher_classes(user, db)
    if allowed_classes is not None:
        if allowed_classes:
            q = q.filter(models.Student.class_name.in_(allowed_classes))
        else:
            return {"students": [], "total": 0, "page": page, "per_page": per_page}

    if search:
        pattern = f"%{search}%"
        q = q.filter(
            (models.Student.first_name.ilike(pattern)) |
            (models.Student.last_name.ilike(pattern))
        )
    if grade:
        q = q.filter_by(grade=grade)
    if class_name:
        q = q.filter_by(class_name=class_name)

    total = q.count()
    students = q.offset((page - 1) * per_page).limit(per_page).all()
    return {
        "students": [schemas.StudentOut.model_validate(s) for s in students],
        "total": total,
        "page": page,
        "per_page": per_page,
    }


@router.post("")
def create_student(
    req: schemas.StudentCreate,
    user=Depends(require_roles("admin", "teacher")),
    db: Session = Depends(get_db),
):
    student = models.Student(**req.model_dump())
    db.add(student)
    log = models.ActivityLog(user_id=user.id, action=f"Added student: {req.first_name} {req.last_name}")
    db.add(log)
    db.commit()
    db.refresh(student)
    return schemas.StudentOut.model_validate(student)


@router.get("/{student_id}")
def get_student(
    student_id: int,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role not in ("admin", "teacher"):
        raise HTTPException(status_code=403, detail="Access denied")
    student = db.query(models.Student).filter_by(id=student_id, is_active=True).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return schemas.StudentOut.model_validate(student)


@router.put("/{student_id}")
def update_student(
    student_id: int,
    req: schemas.StudentUpdate,
    user=Depends(require_roles("admin", "teacher")),
    db: Session = Depends(get_db),
):
    student = db.query(models.Student).filter_by(id=student_id, is_active=True).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    for k, v in req.model_dump(exclude_none=True).items():
        setattr(student, k, v)
    log = models.ActivityLog(user_id=user.id, action=f"Updated student: {student.first_name} {student.last_name}")
    db.add(log)
    db.commit()
    db.refresh(student)
    return schemas.StudentOut.model_validate(student)


@router.delete("/{student_id}")
def delete_student(
    student_id: int,
    user=Depends(require_roles("admin", "teacher")),
    db: Session = Depends(get_db),
):
    student = db.query(models.Student).filter_by(id=student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    student.is_active = False
    log = models.ActivityLog(user_id=user.id, action=f"Removed student: {student.first_name} {student.last_name}")
    db.add(log)
    db.commit()
    return {"message": "Student removed"}
