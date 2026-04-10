import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# 1. Load environment variables
load_dotenv()

# 2. Import local modules 
# Note: Ensure database.py and routers/auth.py exist in your directory
from database import engine, Base
from routers import auth

# 3. Create Database Tables (Crucial for first-time Supabase setup)
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Database connection failed: {e}")

# 4. Initialize the FastAPI app
app = FastAPI(
    title="Smart Schola API",
    description="School Management System - Stable Build",
    version="1.0.0",
)

# 5. Configure CORS
# We use a mix of fixed URLs and wildcards for maximum compatibility
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://smart-schola.vercel.app")

origins = [
    FRONTEND_URL,
    "http://localhost:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 6. Include Routers
# Note: Your auth.py already has a prefix="/auth" inside it, 
# so we don't repeat it here to avoid /auth/auth/login URLs.
app.include_router(auth.router)

# 7. Basic Routes
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