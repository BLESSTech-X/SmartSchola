from typing import Optional, List, Any
from pydantic import BaseModel
from datetime import datetime


# ─── Auth ───────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    username: str
    password: str

class ParentLoginRequest(BaseModel):
    phone: str
    pin: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class UserOut(BaseModel):
    id: int
    username: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Registration ────────────────────────────────────────────────────────────

class TeacherRegisterRequest(BaseModel):
    full_name: str
    username: str
    password: str
    phone: Optional[str] = None
    bio: Optional[str] = None

class ParentRegisterRequest(BaseModel):
    full_name: str
    phone: str
    student_id: int
    relationship_to_student: str
    pin: str


# ─── School / Settings ───────────────────────────────────────────────────────

class SchoolOut(BaseModel):
    id: int
    name: str
    address: Optional[str]
    headmaster: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    sms_provider: Optional[str]
    sms_api_key: Optional[str]
    sms_username: Optional[str]
    sms_sender_id: Optional[str]

    class Config:
        from_attributes = True

class SchoolUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    headmaster: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    sms_provider: Optional[str] = None
    sms_api_key: Optional[str] = None
    sms_username: Optional[str] = None
    sms_sender_id: Optional[str] = None


# ─── Students ────────────────────────────────────────────────────────────────

class StudentCreate(BaseModel):
    first_name: str
    last_name: str
    grade: int
    class_name: str
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    parent_phone: Optional[str] = None
    address: Optional[str] = None

class StudentUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    grade: Optional[int] = None
    class_name: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    parent_phone: Optional[str] = None
    address: Optional[str] = None

class StudentOut(BaseModel):
    id: int
    first_name: str
    last_name: str
    grade: int
    class_name: str
    date_of_birth: Optional[str]
    gender: Optional[str]
    parent_phone: Optional[str]
    address: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True


# ─── Subjects ────────────────────────────────────────────────────────────────

class SubjectCreate(BaseModel):
    name: str
    code: str
    grade_level: Optional[int] = None

class SubjectOut(BaseModel):
    id: int
    name: str
    code: str
    grade_level: Optional[int]
    is_active: bool

    class Config:
        from_attributes = True


# ─── Marks ───────────────────────────────────────────────────────────────────

class MarkInput(BaseModel):
    student_id: int
    subject_id: int
    term: int
    year: int
    score: int

class BulkMarkRequest(BaseModel):
    marks: List[MarkInput]

class MarkOut(BaseModel):
    id: int
    student_id: int
    subject_id: int
    term: int
    year: int
    score: int
    ecz_grade: Optional[int]
    ai_remark: Optional[str]
    verify_required: bool
    subject: Optional[SubjectOut]

    class Config:
        from_attributes = True

class BulkMarkResponse(BaseModel):
    saved: int
    updated: int
    flagged: List[str]


# ─── Fees ─────────────────────────────────────────────────────────────────────

class FeeCreate(BaseModel):
    student_id: int
    term: int
    year: int
    amount_due: float
    amount_paid: Optional[float] = 0.0
    payment_date: Optional[str] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None

class FeeUpdate(BaseModel):
    amount_due: Optional[float] = None
    amount_paid: Optional[float] = None
    payment_date: Optional[str] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None

class FeeOut(BaseModel):
    id: int
    student_id: int
    term: int
    year: int
    amount_due: float
    amount_paid: float
    balance: float
    status: str
    payment_date: Optional[str]
    payment_method: Optional[str]
    notes: Optional[str]
    student: Optional[StudentOut]

    class Config:
        from_attributes = True

class FeeSummary(BaseModel):
    total_due: float
    total_collected: float
    outstanding: float
    record_count: int


# ─── SMS ─────────────────────────────────────────────────────────────────────

class SmsSendRequest(BaseModel):
    recipients: str  # all_parents, fee_defaulters, class_{name}, custom
    class_name: Optional[str] = None
    custom_phone: Optional[str] = None
    message: str

class SmsLogOut(BaseModel):
    id: int
    recipient_phone: str
    recipient_name: Optional[str]
    message: str
    provider: Optional[str]
    status: str
    sent_at: datetime

    class Config:
        from_attributes = True


# ─── Dashboard ───────────────────────────────────────────────────────────────

class ActivityLogOut(BaseModel):
    id: int
    action: str
    details: Optional[Any]
    created_at: datetime
    user_id: Optional[int]

    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    total_students: int
    fees_collected: float
    fees_outstanding: float
    sms_sent_today: int
    pending_approvals: int
    recent_activity: List[ActivityLogOut]


# ─── Admin ───────────────────────────────────────────────────────────────────

class ApprovalRequest(BaseModel):
    user_id: int
    action: str  # approve, reject
    rejection_reason: Optional[str] = None

class TeacherProfileOut(BaseModel):
    id: int
    user_id: int
    subjects_taught: str
    classes_assigned: str
    phone: Optional[str]
    bio: Optional[str]
    approval_status: str
    rejection_reason: Optional[str]
    user: Optional[UserOut]

    class Config:
        from_attributes = True

class ParentProfileOut(BaseModel):
    id: int
    user_id: int
    student_id: int
    relationship_to_student: str
    phone: str
    approval_status: str
    rejection_reason: Optional[str]
    user: Optional[UserOut]
    student: Optional[StudentOut]

    class Config:
        from_attributes = True

class TeacherAssignUpdate(BaseModel):
    classes_assigned: str
    subjects_taught: str
