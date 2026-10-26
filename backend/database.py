import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

ENVIRONMENT = os.getenv("ENVIRONMENT", "development").lower()
DATABASE_URL = os.getenv("DATABASE_URL", "").strip()

if not DATABASE_URL:
    if ENVIRONMENT == "production":
        raise RuntimeError("Production requires DATABASE_URL; refusing to use a local SQLite database.")
    DATABASE_URL = "sqlite:///./smartschola-dev.db"

# Normalise older provider URLs without logging credentials.
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

if ENVIRONMENT == "production" and not DATABASE_URL.startswith(("postgresql://", "postgresql+psycopg2://")):
    raise RuntimeError("Production SmartSchola must use PostgreSQL.")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine_options = {
    "pool_pre_ping": True,
}
if not DATABASE_URL.startswith("sqlite"):
    engine_options.update({"pool_size": 5, "max_overflow": 10, "pool_recycle": 300})

engine = create_engine(DATABASE_URL, connect_args=connect_args, **engine_options)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
