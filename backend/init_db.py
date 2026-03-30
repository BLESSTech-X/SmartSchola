from database import engine, SessionLocal, Base
from sqlalchemy import text
import models
from auth import hash_password
import datetime

def init():
    db = SessionLocal()
    try:
        # 1. Standard Sync
        Base.metadata.create_all(bind=engine)

        # 2. EMERGENCY FORCE: Manually add the balance column if it's missing
        # This bypasses the SQLAlchemy check and talks directly to Supabase
        print("BLESSTechX: Forcing 'balance' column...")
        try:
            db.execute(text("ALTER TABLE students ADD COLUMN IF NOT EXISTS balance FLOAT DEFAULT 0.0;"))
            db.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT FALSE;"))
            db.commit()
            print("Columns verified/added successfully.")
        except Exception as column_error:
            print(f"Column check skipped or already exists: {column_error}")

        # 3. Ensure Admin exists
        admin_user = db.query(models.User).filter_by(username="admin").first()
        if not admin_user:
            new_admin = models.User(
                username="admin",
                full_name="BLESSTechX Admin",
                role="admin",
                hashed_password=hash_password("admin123"),
                is_active=True
            )
            db.add(new_admin)
            db.commit()

        return True
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
        raise e
    finally:
        db.close()