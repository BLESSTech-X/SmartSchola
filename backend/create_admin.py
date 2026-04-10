import bcrypt
# Fix for passlib/bcrypt version conflict
if not hasattr(bcrypt, "__about__"):
    bcrypt.__about__ = type('about', (object,), {'__version__': bcrypt.__version__})

from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext
from database import engine
import models

# Setup password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_admin():
    # Initialize Database Session
    Session = sessionmaker(bind=engine)
    db = Session()

    # YOUR CREDENTIALS - You can change these
    username = "admin"
    password = "password123" 
    email = "admin@blesstechx.com"

    try:
        # 1. Check if user already exists
        existing = db.query(models.User).filter(models.User.username == username).first()
        if existing:
            print(f"⚠️ User '{username}' already exists in Supabase.")
            return

        # 2. Hash the password
        hashed_password = pwd_context.hash(password)

        # 3. Create the User object
        new_user = models.User(
            username=username,
            email=email,
            hashed_password=hashed_password,
            full_name="BlesstechX Admin",
            role="admin",
            is_active=True
        )

        # 4. Save to Supabase
        db.add(new_user)
        db.commit()
        print(f"✅ Success! Admin account created.")
        print(f"Try logging in with: {username} / {password}")

    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()