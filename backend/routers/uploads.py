from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
import os
import shutil

# ── BLESSTech-X: Relative Imports for Render ────────────────────────────────
from ..database import get_db  # '..' tells Python to look in the backend folder
from .. import models          # '..' tells Python to look in the backend folder

router = APIRouter(prefix="/uploads", tags=["File Uploads"])

# Ensure the upload directory exists
UPLOAD_DIR = "static/uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/student-photo/{student_id}")
async def upload_student_photo(
    student_id: int, 
    file: UploadFile = File(...), 
    db: Session = Depends(get_db)
):
    # 1. Verify Student exists
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # 2. Generate a clean filename using the Unique ID we just added
    extension = file.filename.split(".")[-1]
    filename = f"student_{student_id}_{student.unique_id}.{extension}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    # 3. Save the file physically to the server
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File save error: {str(e)}")

    # 4. Update the student's photo_url in the database
    student.photo_url = f"/static/uploads/{filename}"
    db.commit()

    return {
        "status": "Success", 
        "student_name": f"{student.first_name} {student.last_name}",
        "photo_url": student.photo_url
    }