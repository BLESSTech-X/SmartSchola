from fastapi import APIRouter
router = APIRouter(prefix="/sms", tags=["SMS Notifications"])

@router.get("/")
def get_sms_status():
    return {"status": "SMS gateway ready"}