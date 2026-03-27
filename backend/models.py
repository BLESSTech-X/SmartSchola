from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Boolean, Float, DateTime,
    ForeignKey, Text, JSON
)
from sqlalchemy.orm import relationship
from database import Base


class School(Base):
    __tablename__ = "schools"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, default="Smart Schola")
    address = Column(String, nullable=True)
    headmaster = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    sms_provider = Column(String, default="africas_talking")
    sms_api_key = Column(String, nullable=True)
    sms_username = Column(String, nullable=True)
    sms_sender_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, nullable=False)  # admin, teacher, parent
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    teacher_profile = relationship("TeacherProfile", back_populates="user", uselist=False)
    parent_profile = relationship("ParentProfile", back_populates="user", uselist=False)
    marks_entered = relationship("Mark", back_populates="entered_by_user")
    activity_logs = relationship("ActivityLog", back_populates="user")


class TeacherProfile(Base):
    __tablename__ = "teacher_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    subjects_taught = Column(String, default="")  # comma-separated subject IDs
    classes_assigned = Column(String, default="")  # comma-separated class names
    phone = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    approval_status = Column(String, default="pending")  # pending, approved, rejected
    rejection_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="teacher_profile")


class ParentProfile(Base):
    __tablename__ = "parent_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    relationship_to_student = Column(String, default="Guardian")
    phone = Column(String, nullable=False)
    hashed_pin = Column(String, nullable=False)
    approval_status = Column(String, default="pending")  # pending, approved, rejected
    rejection_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="parent_profile")
    student = relationship("Student", back_populates="parent_profiles")


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    grade = Column(Integer, nullable=False)
    class_name = Column(String, nullable=False)
    date_of_birth = Column(String, nullable=True)
    gender = Column(String, nullable=True)
    parent_phone = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    marks = relationship("Mark", back_populates="student")
    fees = relationship("Fee", back_populates="student")
    parent_profiles = relationship("ParentProfile", back_populates="student")


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    code = Column(String, nullable=False)
    grade_level = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    marks = relationship("Mark", back_populates="subject")


class Mark(Base):
    __tablename__ = "marks"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    term = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    score = Column(Integer, nullable=False)
    ecz_grade = Column(Integer, nullable=True)
    ai_remark = Column(Text, nullable=True)
    verify_required = Column(Boolean, default=False)
    entered_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    student = relationship("Student", back_populates="marks")
    subject = relationship("Subject", back_populates="marks")
    entered_by_user = relationship("User", back_populates="marks_entered")


class Fee(Base):
    __tablename__ = "fees"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    term = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    amount_due = Column(Float, nullable=False)
    amount_paid = Column(Float, default=0.0)
    payment_date = Column(String, nullable=True)
    payment_method = Column(String, nullable=True)  # Cash, MoMo, Bank, Bursary
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    student = relationship("Student", back_populates="fees")


class SmsLog(Base):
    __tablename__ = "sms_logs"

    id = Column(Integer, primary_key=True, index=True)
    recipient_phone = Column(String, nullable=False)
    recipient_name = Column(String, nullable=True)
    message = Column(Text, nullable=False)
    provider = Column(String, nullable=True)
    status = Column(String, default="logged")  # delivered, failed, logged
    sent_at = Column(DateTime, default=datetime.utcnow)


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String, nullable=False)
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="activity_logs")
