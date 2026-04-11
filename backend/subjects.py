from fastapi import APIRouter

router = APIRouter(prefix="/subjects", tags=["Subjects"])

@router.get("/")
def get_subjects():
    return {"message": "Subject curriculum active"}