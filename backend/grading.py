from typing import List
from sqlalchemy.orm import Session


def ecz_grade(score: int) -> int:
    """Convert raw score (0-100) to ECZ grade point (1-9)."""
    if score >= 80:
        return 1
    elif score >= 70:
        return 2
    elif score >= 60:
        return 3
    elif score >= 50:
        return 4
    elif score >= 40:
        return 5
    elif score >= 30:
        return 6
    elif score >= 20:
        return 7
    elif score >= 10:
        return 8
    else:
        return 9


def division(ecz_list: List[int]) -> str:
    """Compute ECZ division from a list of grade points."""
    if not ecz_list:
        return "N/A"
    sorted_grades = sorted(ecz_list)
    best_five = sorted_grades[:5]
    aggregate = sum(best_five)
    if aggregate <= 12:
        return "Division I"
    elif aggregate <= 19:
        return "Division II"
    elif aggregate <= 25:
        return "Division III"
    elif aggregate <= 32:
        return "Division IV"
    else:
        return "Fail"


def remark(score: int, subject: str) -> str:
    """Generate a contextual narrative remark based on score range."""
    if score >= 80:
        return f"Excellent performance in {subject}. Keep up the outstanding work."
    elif score >= 70:
        return f"Very good performance in {subject}. A commendable effort this term."
    elif score >= 60:
        return f"Good performance in {subject}. Continue to work hard to achieve distinction."
    elif score >= 50:
        return f"Satisfactory performance in {subject}. With more effort, better results are achievable."
    elif score >= 40:
        return f"Average performance in {subject}. Focus on weak areas and seek teacher guidance."
    elif score >= 30:
        return f"Below average in {subject}. Regular revision and teacher support is recommended."
    elif score >= 20:
        return f"Poor performance in {subject}. Consistent study and extra support are strongly advised."
    elif score >= 10:
        return f"Very poor performance in {subject}. Urgent attention and remediation needed."
    else:
        return f"Extremely poor performance in {subject}. Immediate intervention and support required."


def is_anomaly(score: int, student_id: int, subject_id: int, db: Session) -> bool:
    """Check if a score deviates more than 25 points from the student's recent average."""
    import models
    recent_marks = (
        db.query(models.Mark)
        .filter(
            models.Mark.student_id == student_id,
            models.Mark.subject_id == subject_id
        )
        .order_by(models.Mark.created_at.desc())
        .limit(3)
        .all()
    )
    if len(recent_marks) < 2:
        return False
    avg = sum(m.score for m in recent_marks) / len(recent_marks)
    return abs(score - avg) > 25


def class_position(student_id: int, class_name: str, term: int, year: int, db: Session) -> dict:
    """Compute student rank within their class for a given term/year."""
    import models
    students = (
        db.query(models.Student)
        .filter(
            models.Student.class_name == class_name,
            models.Student.is_active == True
        )
        .all()
    )

    totals = []
    for s in students:
        marks = (
            db.query(models.Mark)
            .filter(
                models.Mark.student_id == s.id,
                models.Mark.term == term,
                models.Mark.year == year
            )
            .all()
        )
        total = sum(m.score for m in marks)
        totals.append((s.id, total))

    totals.sort(key=lambda x: x[1], reverse=True)
    position = next((i + 1 for i, (sid, _) in enumerate(totals) if sid == student_id), None)
    return {"position": position, "out_of": len(totals)}
