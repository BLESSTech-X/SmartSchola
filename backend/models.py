from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    role = Column(String, default="student")  # legacy global role; school role is stored in SchoolMembership
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class School(Base):
    """Public school directory/control-plane record. Operational data must be routed to the school's own database."""
    __tablename__ = "schools"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(180), nullable=False)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    location = Column(String(180), default="")
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class SchoolMembership(Base):
    """Explicit permission to enter one school; never trust the role selected in the browser."""
    __tablename__ = "school_memberships"
    __table_args__ = (UniqueConstraint("school_id", "user_id", name="uq_school_membership"),)

    id = Column(Integer, primary_key=True, index=True)
    school_id = Column(Integer, ForeignKey("schools.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(30), nullable=False)
    is_authorized = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class LoginAttempt(Base):
    __tablename__ = "school_login_attempts"
    __table_args__ = (UniqueConstraint("school_id", "identity_key", name="uq_school_login_identity"),)

    id = Column(Integer, primary_key=True, index=True)
    school_id = Column(Integer, ForeignKey("schools.id", ondelete="CASCADE"), nullable=False, index=True)
    identity_key = Column(String(320), nullable=False, index=True)
    failed_attempts = Column(Integer, default=0, nullable=False)
    is_blocked = Column(Boolean, default=False, nullable=False)
    last_ip = Column(String(64), default="")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class PasswordResetToken(Base):
    __tablename__ = "school_password_reset_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    school_id = Column(Integer, ForeignKey("schools.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column(String(64), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
