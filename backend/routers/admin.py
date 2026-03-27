from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
from auth import require_roles

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/stats")
def stats(user=Depends(require_roles("admin")), db: Session = Depends(get_db)):
    pending_teachers = db.query(models.TeacherProfile).filter_by(approval_status="pending").count()
    pending_parents = db.query(models.ParentProfile).filter_by(approval_status="pending").count()
    total_teachers = db.query(models.TeacherProfile).filter_by(approval_status="approved").count()
    total_parents = db.query(models.ParentProfile).filter_by(approval_status="approved").count()
    total_admins = db.query(models.User).filter_by(role="admin", is_active=True).count()
    return {
        "pending_teachers": pending_teachers,
        "pending_parents": pending_parents,
        "total_teachers": total_teachers,
        "total_parents": total_parents,
        "total_admins": total_admins,
        "total_pending": pending_teachers + pending_parents,
    }


@router.get("/pending")
def pending(user=Depends(require_roles("admin")), db: Session = Depends(get_db)):
    teachers = (
        db.query(models.TeacherProfile)
        .filter_by(approval_status="pending")
        .join(models.User)
        .all()
    )
    parents = (
        db.query(models.ParentProfile)
        .filter_by(approval_status="pending")
        .join(models.User)
        .all()
    )

    def fmt_teacher(p):
        return {
            "id": p.id, "user_id": p.user_id,
            "full_name": p.user.full_name, "username": p.user.username,
            "phone": p.phone, "bio": p.bio, "type": "teacher",
        }

    def fmt_parent(p):
        student = db.query(models.Student).filter_by(id=p.student_id).first()
        return {
            "id": p.id, "user_id": p.user_id,
            "full_name": p.user.full_name, "phone": p.phone,
            "relationship": p.relationship_to_student,
            "student_name": f"{student.first_name} {student.last_name}" if student else "Unknown",
            "student_grade": student.grade if student else None,
            "student_class": student.class_name if student else None,
            "type": "parent",
        }

    return {
        "teachers": [fmt_teacher(t) for t in teachers],
        "parents": [fmt_parent(p) for p in parents],
    }


@router.post("/approve")
def approve(req: schemas.ApprovalRequest, user=Depends(require_roles("admin")), db: Session = Depends(get_db)):
    target_user = db.query(models.User).filter_by(id=req.user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    if req.action == "approve":
        target_user.is_active = True
        if target_user.role == "teacher":
            profile = db.query(models.TeacherProfile).filter_by(user_id=req.user_id).first()
            if profile:
                profile.approval_status = "approved"
        elif target_user.role == "parent":
            profile = db.query(models.ParentProfile).filter_by(user_id=req.user_id).first()
            if profile:
                profile.approval_status = "approved"
        log_action = f"Approved {target_user.role}: {target_user.full_name}"
    elif req.action == "reject":
        target_user.is_active = False
        if target_user.role == "teacher":
            profile = db.query(models.TeacherProfile).filter_by(user_id=req.user_id).first()
            if profile:
                profile.approval_status = "rejected"
                profile.rejection_reason = req.rejection_reason
        elif target_user.role == "parent":
            profile = db.query(models.ParentProfile).filter_by(user_id=req.user_id).first()
            if profile:
                profile.approval_status = "rejected"
                profile.rejection_reason = req.rejection_reason
        log_action = f"Rejected {target_user.role}: {target_user.full_name}"
    else:
        raise HTTPException(status_code=400, detail="Invalid action")

    log = models.ActivityLog(user_id=user.id, action=log_action)
    db.add(log)
    db.commit()
    return {"message": f"User {req.action}d successfully"}


@router.get("/teachers")
def list_teachers(user=Depends(require_roles("admin")), db: Session = Depends(get_db)):
    profiles = (
        db.query(models.TeacherProfile)
        .filter_by(approval_status="approved")
        .join(models.User)
        .all()
    )
    return [
        {
            "id": p.id, "user_id": p.user_id,
            "full_name": p.user.full_name, "username": p.user.username,
            "phone": p.phone, "classes_assigned": p.classes_assigned,
            "subjects_taught": p.subjects_taught,
        }
        for p in profiles
    ]


@router.put("/teacher/{user_id}")
def update_teacher(
    user_id: int,
    req: schemas.TeacherAssignUpdate,
    user=Depends(require_roles("admin")),
    db: Session = Depends(get_db)
):
    profile = db.query(models.TeacherProfile).filter_by(user_id=user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Teacher not found")
    profile.classes_assigned = req.classes_assigned
    profile.subjects_taught = req.subjects_taught
    log = models.ActivityLog(user_id=user.id, action=f"Updated teacher assignments for user_id={user_id}")
    db.add(log)
    db.commit()
    return {"message": "Teacher assignments updated"}


@router.get("/parents")
def list_parents(user=Depends(require_roles("admin")), db: Session = Depends(get_db)):
    profiles = (
        db.query(models.ParentProfile)
        .filter_by(approval_status="approved")
        .join(models.User)
        .all()
    )
    return [
        {
            "id": p.id, "user_id": p.user_id,
            "full_name": p.user.full_name, "phone": p.phone,
            "relationship": p.relationship_to_student,
            "student_id": p.student_id,
            "student_name": f"{p.student.first_name} {p.student.last_name}" if p.student else "Unknown",
        }
        for p in profiles
    ]


@router.delete("/user/{user_id}")
def delete_user(user_id: int, user=Depends(require_roles("admin")), db: Session = Depends(get_db)):
    target = db.query(models.User).filter_by(id=user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if target.id == user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    name = target.full_name
    db.delete(target)
    log = models.ActivityLog(user_id=user.id, action=f"Deleted user: {name}")
    db.add(log)
    db.commit()
    return {"message": "User deleted"}
