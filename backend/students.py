from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import database

router = APIRouter(prefix="/students", tags=["Students"])

@router.get("/")
def get_students(db: Session = Depends(database.get_db)):
    return {"message": "Student management system active"}