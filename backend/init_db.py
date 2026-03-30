"""
SmartSchola Database Initialization Script
Run once: python init_db.py
Creates all tables and seeds default admin, teacher, and parent accounts.
"""
from database import engine, SessionLocal
from models import Base, User, TeacherProfile, ParentProfile, Student, School
from auth import hash_password

def init():
    # Create all tables in the database if they don't exist
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # ── 1. School Information ──────────────────────────────────────────
        school = db.query(School).first()
        if not school:
            school = School(
                name="Smart Schola Demo School",
                address="123 Education Road, Lusaka, Zambia",
                headmaster="Mr. J. Banda",
                phone="+260977000000",
                email="admin@smartschola.zm",
            )
            db.add(school)
            print("✅ Created demo school profile.")

        # ── 2. Admin User ──────────────────────────────────────────────────
        if not db.query(User).filter_by(username="admin").first():
            admin = User(
                username="admin",
                full_name="System Administrator",
                role="admin",
                # This uses our truncated hash from auth.py
                hashed_password=hash_password("schola2024"),
                is_active=True,
            )
            db.add(admin)
            print("✅ Created admin user — User: admin / Pass: schola2024")

        # ── 3. Test Teacher ────────────────────────────────────────────────
        if not db.query(User).filter_by(username="testteacher").first():
            teacher_user = User(
                username="testteacher",
                full_name="Mr. T. Phiri",
                role="teacher",
                hashed_password=hash_password("teacher1234"),
                is_active=True,
            )
            db.add(teacher_user)
            db.flush()  # Get ID for profile

            profile = TeacherProfile(
                user_id=teacher_user.id,
                subjects_taught="Mathematics, Science",
                classes_assigned="7A, 8B",
                phone="+260977111111",
                bio="Senior Educator specializing in STEM subjects.",
                approval_status="approved",
            )
            db.add(profile)
            print("✅ Created test teacher — User: testteacher / Pass: teacher1234")

        # ── 4. Sample Student (Needed for Parent Link) ─────────────────────
        student = db.query(Student).first()
        if not student:
            student = Student(
                first_name="Chanda",
                last_name="Bwalya",
                grade=7,
                class_name="7A",
                gender="Male",
                parent_phone="+260971234567",
            )
            db.add(student)
            db.flush()
            print(f"✅ Created sample student: {student.first_name} {student.last_name}")

        # ── 5. Test Parent ─────────────────────────────────────────────────
        parent_username = "+260971234567"
        if not db.query(User).filter_by(username=parent_username).first():
            parent_user = User(
                username=parent_username,
                full_name="Mrs. Bwalya",
                role="parent",
                hashed_password=hash_password("123456"),
                is_active=True,
            )
            db.add(parent_user)
            db.flush()

            parent_profile = ParentProfile(
                user_id=parent_user.id,
                student_id=student.id,
                relationship_to_student="Mother",
                phone=parent_username,
                # Using hash_password for the PIN as well
                hashed_pin=hash_password("123456"),
                approval_status="approved",
            )
            db.add(parent_profile)
            print(f"✅ Created test parent — Phone: {parent_username} / PIN: 123456")

        # Commit all changes to the database
        db.commit()
        print("\n🚀 SmartSchola Database Initialized Successfully!")

    except Exception as e:
        db.rollback()
        print(f"❌ Initialization Error: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    init()