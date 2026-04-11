from fastapi import APIRouter
router = APIRouter(prefix="/parent-portal", tags=["Parent Portal"])

@router.get("/")
def get_portal_status():
    return {"message": "Parent portal active"}