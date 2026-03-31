import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles  # New: For Photo Support
from dotenv import load_dotenv

load_dotenv()

# ── 1. IMPORT ALL ROUTERS ────────────────────────────────────────────────────
from routers import (
    auth, registration, admin, students, subjects,
    marks, fees, reports, sms, dashboard, settings, 
    parent_portal, admin_mgmt, 
    uploads, community  # <--- BLESSTech-X: Added Uploads & Community
)

app = FastAPI(
    title="Smart Schola API",
    description="BLESSTech-X School Management System — ECZ Grading, PDF Reports, SMS Notifications",
    version="1.1.0", # Updated version
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── 2. PHOTO STORAGE SETUP ───────────────────────────────────────────────────
# This ensures a 'static' folder exists for student photos and community images
UPLOAD_DIR = "static/uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR, exist_ok=True)

# This line makes the photos accessible via URL (e.g., your-api.com/static/photo.jpg)
app.mount("/static", StaticFiles(directory="static"), name="static")

# ── 3. CORS FIX (BLESSTech-X Production Update) ───────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── 4. REGISTER ROUTERS ───────────────────────────────────────────────────────
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
app.include_router(admin_mgmt.router)
app.include_router(uploads.router)    # <--- New: Photo ID Handling
app.include_router(community.router)  # <--- New: School Square Updates

# ── 5. SYSTEM ENDPOINTS ───────────────────────────────────────────────────────
@app.get("/")
def root():
    return {
        "name": "Smart Schola API",
        "brand": "BLESSTech-X",
        "version": "1.1.0",
        "status": "running",
        "docs": "/docs",
        "storage": "/static/uploads"
    }

@app.get("/health")
def health():
    return {"status": "ok"}

# ── 6. SECRET SETUP (Free Tier Database Sync) ────────────────────────────────
@app.get("/secret-setup-admin")
def setup_admin():
    from init_db import init
    try:
        init() 
        return {"status": "Success", "message": "SmartSchola Database & Admin Synced!"}
    except Exception as e:
        return {"status": "Error", "detail": str(e)}