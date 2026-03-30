import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from routers import (
    auth, registration, admin, students, subjects,
    marks, fees, reports, sms, dashboard, settings, parent_portal
)

app = FastAPI(
    title="Smart Schola API",
    description="School Management System for Zambian Schools — ECZ Grading, PDF Reports, SMS Notifications",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS FIX (BLESSTech-X Production Update) ──────────────────────────────────
# We are allowing all origins ("*") temporarily to ensure the Vercel-to-Render 
# connection is solid. This kills the "Blocked by CORS policy" error.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
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


@app.get("/")
def root():
    return {
        "name": "Smart Schola API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/secret-setup-admin")
def setup_admin():
    from init_db import init
    try:
        init() # This runs your script that creates/updates the admin
        return {"status": "Success", "message": "Admin user created for SmartSchola!"}
    except Exception as e:
        return {"status": "Error", "detail": str(e)}