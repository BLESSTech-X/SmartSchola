import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get the database URL, defaulting to local SQLite if not found
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./smartschola.db")

# 1. Fix for Neon/Supabase/Render: SQLAlchemy requires 'postgresql://' 
# but many providers give 'postgres://'
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# 2. Connection Arguments
# 'check_same_thread' is ONLY for SQLite. 
# For Postgres, we don't pass this argument.
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

# 3. Create Engine
# pool_pre_ping: Checks if the connection is alive before using it (crucial for cloud DBs)
# pool_recycle: Closes connections after 5 minutes to prevent 'stale' connections
engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
    pool_recycle=300,
)

# 4. Session and Base Setup
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# 5. Dependency for FastAPI/Main app
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()