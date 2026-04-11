from fastapi import APIRouter

router = APIRouter(prefix="/marks", tags=["Grades & Marks"])

@router.get("/")
def get_marks():
    return {"message": "Grading system active"}