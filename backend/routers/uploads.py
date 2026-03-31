from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
import models, os, shutil

router = APIRouter(prefix="/uploads", tags=["File Uploads"])

UPLOAD_DIR = "static/uploads"

@router.post("/student-photo/{student_id}")
async def upload_student_photo(student_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    student = db.query(models.Student).filter_by(id=student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Clean the filename and create a path
    extension = file.filename.split(".")[-1]
    filename = f"student_{student_id}_{student.unique_id}.{extension}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    # Save the file to the local folder
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Save the URL/Path to the database
    student.photo_url = f"/static/uploads/{filename}"
    db.commit()

    return {"status": "Success", "photo_url": student.photo_url}