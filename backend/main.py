import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

# We import directly from the same folder now
import auth, registration, admin, students, subjects, marks, fees, reports, sms, dashboard, settings, parent_portal

app = FastAPI(
    title="Smart Schola API",
    description="School Management System - BLESSTech-X Build",
    version="1.0.0",
)

# ── CORS FIX (Ensures Vercel can always talk to Render) ─────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers (Updated to use the direct imports) ─────────────────────────────
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
    return {"name": "Smart Schola API", "status": "Online", "version": "1.0.0"}

@app.get("/health")
def health():
    return {"status": "ok"}