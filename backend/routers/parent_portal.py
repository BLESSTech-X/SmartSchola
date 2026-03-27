from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from database import get_db
import models
from auth import get_current_parent
import grading
import pdf_generator

router = APIRouter(prefix="/parent", tags=["parent"])


def _get_parent_profile(user, db):
    profile = db.query(models.ParentProfile).filter_by(user_id=user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Parent profile not found")
    return profile


@router.get("/profile")
def profile(user=Depends(get_current_parent), db: Session = Depends(get_db)):
    p = _get_parent_profile(user, db)
    student = db.query(models.Student).filter_by(id=p.student_id).first()
    return {
        "id": p.id,
        "full_name": user.full_name,
        "phone": p.phone,
        "relationship": p.relationship_to_student,
        "student": {
            "id": student.id,
            "first_name": student.first_name,
            "last_name": student.last_name,
            "grade": student.grade,
            "class_name": student.class_name,
            "gender": student.gender,
        } if student else None,
    }


@router.get("/my-child")
def my_child(user=Depends(get_current_parent), db: Session = Depends(get_db)):
    p = _get_parent_profile(user, db)
    student = db.query(models.Student).filter_by(id=p.student_id, is_active=True).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    school = db.query(models.School).first()

    # Find latest term/year
    latest_mark = (
        db.query(models.Mark)
        .filter_by(student_id=student.id)
        .order_by(models.Mark.year.desc(), models.Mark.term.desc())
        .first()
    )
    latest_term = latest_mark.term if latest_mark else 1
    latest_year = latest_mark.year if latest_mark else 2025

    # Get marks for latest term
    marks = (
        db.query(models.Mark)
        .filter_by(student_id=student.id, term=latest_term, year=latest_year)
        .all()
    )

    # Fee summary
    fees = db.query(models.Fee).filter_by(student_id=student.id).all()
    total_due = sum(f.amount_due for f in fees)
    total_paid = sum(f.amount_paid for f in fees)
    outstanding = sum(max(f.amount_due - f.amount_paid, 0) for f in fees)

    return {
        "student": {
            "id": student.id,
            "first_name": student.first_name,
            "last_name": student.last_name,
            "grade": student.grade,
            "class_name": student.class_name,
            "gender": student.gender,
        },
        "school_name": school.name if school else "Smart Schola",
        "latest_term": latest_term,
        "latest_year": latest_year,
        "marks_count": len(marks),
        "marks": [
            {
                "subject": m.subject.name if m.subject else "Unknown",
                "score": m.score,
                "ecz_grade": m.ecz_grade,
                "remark": m.ai_remark,
            }
            for m in marks
        ],
        "fee_summary": {
            "total_due": round(total_due, 2),
            "total_paid": round(total_paid, 2),
            "outstanding": round(outstanding, 2),
        },
    }


@router.get("/marks")
def get_marks(
    term: int = None,
    year: int = None,
    user=Depends(get_current_parent),
    db: Session = Depends(get_db),
):
    p = _get_parent_profile(user, db)
    q = db.query(models.Mark).filter_by(student_id=p.student_id)
    if term:
        q = q.filter_by(term=term)
    if year:
        q = q.filter_by(year=year)
    marks = q.all()
    return [
        {
            "id": m.id,
            "subject": m.subject.name if m.subject else "Unknown",
            "subject_code": m.subject.code if m.subject else "",
            "score": m.score,
            "ecz_grade": m.ecz_grade,
            "remark": m.ai_remark,
            "term": m.term,
            "year": m.year,
        }
        for m in marks
    ]


@router.get("/fees")
def get_fees(user=Depends(get_current_parent), db: Session = Depends(get_db)):
    p = _get_parent_profile(user, db)
    fees = db.query(models.Fee).filter_by(student_id=p.student_id).all()
    result = []
    for f in fees:
        balance = f.amount_due - f.amount_paid
        status = "Paid" if f.amount_paid >= f.amount_due else ("Partial" if f.amount_paid > 0 else "Unpaid")
        result.append({
            "id": f.id,
            "term": f.term,
            "year": f.year,
            "amount_due": f.amount_due,
            "amount_paid": f.amount_paid,
            "balance": round(max(balance, 0), 2),
            "status": status,
            "payment_date": f.payment_date,
            "payment_method": f.payment_method,
        })
    return result


@router.get("/report/pdf")
def report_pdf(
    term: int = Query(...),
    year: int = Query(...),
    user=Depends(get_current_parent),
    db: Session = Depends(get_db),
):
    p = _get_parent_profile(user, db)
    student = db.query(models.Student).filter_by(id=p.student_id, is_active=True).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    marks = db.query(models.Mark).filter_by(student_id=student.id, term=term, year=year).all()
    if not marks:
        raise HTTPException(status_code=404, detail="No marks found for this term/year")

    school = db.query(models.School).first()
    position_data = grading.class_position(student.id, student.class_name, term, year, db)
    buf = pdf_generator.generate_student_report(student, marks, school, position_data)
    filename = f"report_{student.first_name}_{student.last_name}_T{term}_{year}.pdf"

    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/available-terms")
def available_terms(user=Depends(get_current_parent), db: Session = Depends(get_db)):
    p = _get_parent_profile(user, db)
    marks = db.query(models.Mark).filter_by(student_id=p.student_id).all()
    seen = set()
    terms = []
    for m in marks:
        key = (m.term, m.year)
        if key not in seen:
            seen.add(key)
            terms.append({"term": m.term, "year": m.year})
    terms.sort(key=lambda x: (x["year"], x["term"]))
    return terms
