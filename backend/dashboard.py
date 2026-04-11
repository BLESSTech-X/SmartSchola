from fastapi import APIRouter
router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/")
def get_dashboard_stats():
    return {"message": "Dashboard data active"}