import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

import auth, registration, admin, students, subjects, marks, fees, reports, sms, dashboard, settings, parent_portal

app = FastAPI(
    title="SmartSchola API",
    description="School Management System - BLESSTech-X Build",
    version="1.1.0",
)

# Set ALLOWED_ORIGINS to comma-separated exact frontend origins in each environment.
_default_origins = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"
ALLOWED_ORIGINS = [
    origin.strip().rstrip("/")
    for origin in os.getenv("ALLOWED_ORIGINS", _default_origins).split(",")
    if origin.strip()
]
if "*" in ALLOWED_ORIGINS:
    raise RuntimeError("Wildcard CORS origins are not permitted for SmartSchola.")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

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
    return {"name": "SmartSchola API", "status": "online", "version": app.version}


@app.get("/health")
def health():
    return {"status": "ok"}
