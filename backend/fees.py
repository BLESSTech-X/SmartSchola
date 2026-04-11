from fastapi import APIRouter

router = APIRouter(prefix="/fees", tags=["Financials"])

@router.get("/")
def get_fees():
    return {"message": "Fee tracking active"}