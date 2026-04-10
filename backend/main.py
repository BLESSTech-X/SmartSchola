import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# 1. Load environment variables first
load_dotenv()

# 2. Import your local modules using absolute imports
from database import engine, Base
from routers import auth

# 3. Initialize the FastAPI app
app = FastAPI(
    title="Smart Schola API",
    description="School Management System - Stable Build",
    version="1.0.0",
)

# 4. Configure CORS
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://smart-schola.vercel.app")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_URL,
        "http://localhost:5173",
        "http://localhost:3000",
        "https://*.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 5. Include Routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])

# 6. Basic Routes
@app.get("/")
def root():
    return {
        "name": "Smart Schola API",
        "status": "Online",
        "version": "1.0.0",
        "database": "Connected"
    }

@app.get("/health")
def health():
    return {"status": "ok"}