from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from database import get_db
import models
from auth import get_current_user, require_roles
import grading
import pdf_generator

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/student/{student_id}/pdf")
def student_report_pdf(
    student_id: int,
    term: int = Query(...),
    year: int = Query(...),
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role not in ("admin", "teacher", "parent"):
        raise HTTPException(status_code=403, detail="Access denied")

    student = db.query(models.Student).filter_by(id=student_id, is_active=True).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    marks = (
        db.query(models.Mark)
        .filter_by(student_id=student_id, term=term, year=year)
        .all()
    )
    if not marks:
        raise HTTPException(status_code=404, detail="No marks found for this student/term/year")

    school = db.query(models.School).first()
    position_data = grading.class_position(student_id, student.class_name, term, year, db)

    buf = pdf_generator.generate_student_report(student, marks, school, position_data)
    filename = f"report_{student.first_name}_{student.last_name}_T{term}_{year}.pdf"

    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/class/{class_name}/pdf")
def class_report_pdf(
    class_name: str,
    term: int = Query(...),
    year: int = Query(...),
    user=Depends(require_roles("admin", "teacher")),
    db: Session = Depends(get_db),
):
    students = db.query(models.Student).filter_by(class_name=class_name, is_active=True).all()
    if not students:
        raise HTTPException(status_code=404, detail="No students found in this class")

    students_data = []
    for s in students:
        marks = db.query(models.Mark).filter_by(student_id=s.id, term=term, year=year).all()
        total = sum(m.score for m in marks)
        ecz_grades = [m.ecz_grade for m in marks if m.ecz_grade]
        div = grading.division(ecz_grades) if ecz_grades else "N/A"
        pos_data = grading.class_position(s.id, class_name, term, year, db)
        students_data.append({
            "name": f"{s.first_name} {s.last_name}",
            "grade": s.grade,
            "total": total,
            "division": div,
            "position": pos_data.get("position", "—"),
        })

    students_data.sort(key=lambda x: x["position"] if isinstance(x["position"], int) else 999)
    school = db.query(models.School).first()
    buf = pdf_generator.generate_class_report(students_data, class_name, term, year, school)
    filename = f"class_report_{class_name}_T{term}_{year}.pdf"

    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
