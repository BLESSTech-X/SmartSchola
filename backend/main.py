import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

# ── 1. IMPORT ALL ROUTERS ────────────────────────────────────────────────────
from routers import (
    auth, registration, admin, students, subjects,
    marks, fees, reports, sms, dashboard, settings, 
    parent_portal, admin_mgmt  # <--- Added the new Management Router
)

app = FastAPI(
    title="Smart Schola API",
    description="BLESSTech-X School Management System — ECZ Grading, PDF Reports, SMS Notifications",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── 2. CORS FIX (BLESSTech-X Production Update) ───────────────────────────────
# Allowing all origins ("*") to ensure Vercel Frontend can talk to Render Backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── 3. REGISTER ROUTERS ───────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(registration.router)
app.include_router(admin.router)
app.include_router(students.router)
app.include_router(subjects.router)
app.include_router(marks.router)
app.include_router(fees.router)
app.include_router(reports.router)
app.include_router(sms.router)
app.include_router(dashboard.router)
app.include_router(settings.router)
app.include_router(parent_portal.router)
app.include_router(admin_mgmt.router) # <--- Added for Teacher Approvals & Manual Fees


# ── 4. SYSTEM ENDPOINTS ───────────────────────────────────────────────────────
@app.get("/")
def root():
    return {
        "name": "Smart Schola API",
        "brand": "BLESSTech-X",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }

@app.get("/health")
def health():
    return {"status": "ok"}

# ── 5. SECRET SETUP (Free Tier Database Sync) ────────────────────────────────
@app.get("/secret-setup-admin")
def setup_admin():
    from init_db import init
    try:
        # This script runs Base.metadata.create_all(bind=engine) 
        # which creates your new 2026 columns (is_active, balance, etc.)
        init() 
        return {"status": "Success", "message": "SmartSchola Database & Admin Synced!"}
    except Exception as e:
        return {"status": "Error", "detail": str(e)}