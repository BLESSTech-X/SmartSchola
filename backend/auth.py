import hashlib
import os
import secrets
import smtplib
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

import auth_utils
import models
import schemas
from database import get_db

router = APIRouter(prefix="/auth", tags=["Authentication"])
MAX_FAILED_ATTEMPTS = 3
RESET_LINK_MINUTES = 30


def _normalise_identity(value: str) -> str:
    return value.strip().lower()


def _send_reset_email(recipient: str, school_name: str, reset_link: str) -> None:
    """Send only after support has completed manual identity and school verification."""
    host = os.getenv("SMTP_HOST")
    port = int(os.getenv("SMTP_PORT", "587"))
    username = os.getenv("SMTP_USERNAME")
    password = os.getenv("SMTP_PASSWORD")
    sender = os.getenv("SMTP_FROM")
    if not all([host, username, password, sender]):
        raise HTTPException(status_code=503, detail="Password-reset email is not configured. The account was not unblocked.")
    message = EmailMessage()
    message["Subject"] = f"{school_name}: secure SmartSchola sign-in reset"
    message["From"] = sender
    message["To"] = recipient
    message.set_content(
        f"A SmartSchola support administrator verified your school access.\n\n"
        f"Use this one-time link within {RESET_LINK_MINUTES} minutes to update your login information:\n"
        f"{reset_link}\n\nIf you did not request this, contact SmartSchola support."
    )
    try:
        with smtplib.SMTP(host, port, timeout=15) as smtp:
            smtp.starttls()
            smtp.login(username, password)
            smtp.send_message(message)
    except Exception as exc:
        raise HTTPException(status_code=502, detail="The reset email could not be delivered. The account remains blocked.") from exc


@router.post("/login", response_model=schemas.Token)
def login(
    user_credentials: schemas.UserLogin,
    request: Request,
    db: Session = Depends(get_db),
):
    school = db.query(models.School).filter(
        models.School.slug == user_credentials.school_slug,
        models.School.is_active.is_(True),
    ).first()
    if school is None:
        raise HTTPException(status_code=401, detail="This school is not available for sign-in. Return to the school list and choose a registered school.")

    identity = _normalise_identity(user_credentials.username)
    # Identity key is scoped to the chosen school; attempts at one school do not affect another.
    attempt = db.query(models.LoginAttempt).filter_by(
        school_id=school.id, identity_key=identity
    ).first()
    if attempt and attempt.is_blocked:
        raise HTTPException(
            status_code=423,
            detail="This sign-in has been temporarily flagged after three failed attempts. Contact SmartSchola support. Access is restored only after support verifies your identity with the school's headmaster.",
        )

    membership = db.query(models.SchoolMembership).filter(
        models.SchoolMembership.school_id == school.id,
        models.SchoolMembership.is_authorized.is_(True),
        or_(
            func.lower(models.SchoolMembership.login_identifier) == identity,
            func.lower(models.User.email) == identity,
        ),
    ).join(models.User, models.User.id == models.SchoolMembership.user_id).first()
    user = db.query(models.User).filter(models.User.id == membership.user_id).first() if membership else None

    role = user_credentials.role.strip().lower()
    valid_role = membership is not None and membership.role.lower() == role
    valid_password = user is not None and user.is_active and auth_utils.verify_password(
        user_credentials.password, user.hashed_password
    )
    if not user or not user.is_active or not valid_role or not valid_password:
        if attempt is None:
            attempt = models.LoginAttempt(
                school_id=school.id,
                identity_key=identity,
                failed_attempts=0,
            )
            db.add(attempt)
        attempt.failed_attempts += 1
        attempt.last_ip = (request.client.host if request.client else "")[:64]
        if attempt.failed_attempts >= MAX_FAILED_ATTEMPTS:
            attempt.is_blocked = True
        db.commit()
        if attempt.is_blocked:
            raise HTTPException(
                status_code=423,
                detail="Three failed attempts have flagged this sign-in. Contact SmartSchola support for verification. We will confirm your details with the school's headmaster before restoring access.",
            )
        remaining = MAX_FAILED_ATTEMPTS - attempt.failed_attempts
        raise HTTPException(
            status_code=401,
            detail=f"Sign-in failed for {school.name}. Use credentials authorised by this school only. {remaining} attempt(s) remain before this sign-in is flagged.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Successful authentication is only possible with an authorised membership in the selected school.
    if attempt:
        attempt.failed_attempts = 0
        attempt.last_ip = (request.client.host if request.client else "")[:64]
        db.commit()

    access_token = auth_utils.create_access_token(
        data={
            "sub": user.email,
            "role": membership.role,
            "school_id": school.id,
            "school_slug": school.slug,
        },
        expires_delta=timedelta(minutes=auth_utils.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=schemas.UserOut)
def get_current_user_info(current_user: models.User = Depends(auth_utils.get_current_user)):
    return current_user


@router.post("/password-reset")
def reset_password(payload: schemas.PasswordResetRequest, db: Session = Depends(get_db)):
    digest = hashlib.sha256(payload.token.encode("utf-8")).hexdigest()
    token_row = db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.token_hash == digest,
        models.PasswordResetToken.used_at.is_(None),
        models.PasswordResetToken.expires_at > datetime.now(timezone.utc),
    ).first()
    if not token_row:
        raise HTTPException(status_code=400, detail="This reset link is invalid or has expired. Contact SmartSchola support.")
    user = db.query(models.User).filter(models.User.id == token_row.user_id).first()
    if not user:
        raise HTTPException(status_code=400, detail="This reset link is invalid or has expired.")
    user.hashed_password = auth_utils.get_password_hash(payload.new_password)
    token_row.used_at = datetime.now(timezone.utc)
    attempt = db.query(models.LoginAttempt).filter_by(
        school_id=token_row.school_id, identity_key=token_row.identity_key
    ).first()
    if attempt:
        attempt.failed_attempts = 0
        attempt.is_blocked = False
    db.commit()
    return {"message": "Password updated. You can now sign in to your school."}


def unblock_and_send_reset(
    school_slug: str,
    user_email: str,
    db: Session,
    frontend_base_url: str,
) -> None:
    """Support-only helper. Call only after fee policy (if applicable) and headmaster verification are complete."""
    school = db.query(models.School).filter_by(slug=school_slug, is_active=True).first()
    user = db.query(models.User).filter(models.User.email == user_email.strip().lower()).first()
    if not school or not user:
        raise HTTPException(status_code=404, detail="School or account not found.")
    membership = db.query(models.SchoolMembership).filter_by(
        school_id=school.id, user_id=user.id
    ).first()
    if not membership:
        raise HTTPException(status_code=403, detail="This account is not registered to the selected school.")
    possible_identities = [user.email.lower()]
    if membership.login_identifier:
        possible_identities.append(membership.login_identifier.strip().lower())
    attempt = db.query(models.LoginAttempt).filter(
        models.LoginAttempt.school_id == school.id,
        models.LoginAttempt.identity_key.in_(possible_identities),
        models.LoginAttempt.is_blocked.is_(True),
    ).first()
    if not attempt:
        raise HTTPException(status_code=409, detail="This school sign-in is not currently blocked.")
    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    reset_row = models.PasswordResetToken(
        user_id=user.id,
        school_id=school.id,
        token_hash=token_hash,
        identity_key=attempt.identity_key,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=RESET_LINK_MINUTES),
    )
    db.add(reset_row)
    db.flush()
    reset_link = f"{frontend_base_url.rstrip('/')}/reset-password?token={raw_token}"
    try:
        _send_reset_email(user.email, school.name, reset_link)
    except Exception:
        db.rollback()
        raise
    attempt.is_blocked = False
    attempt.failed_attempts = 0
    db.commit()
