"""
Run once: python init_db.py
Creates all tables and seeds default admin, teacher, and parent accounts.
"""
from database import engine, SessionLocal
from models import Base, User, TeacherProfile, ParentProfile, Student, School
from auth import hash_password

def init():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # ── School ────────────────────────────────────────────────────────────
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

        # ── Admin ─────────────────────────────────────────────────────────────
        if not db.query(User).filter_by(username="admin").first():
            admin = User(
                username="admin",
                full_name="System Administrator",
                role="admin",
                hashed_password=hash_password("schola2024"),
                is_active=True,
            )
            db.add(admin)
            print("Created admin user — username: admin / password: schola2024")

        # ── Test Teacher ──────────────────────────────────────────────────────
        teacher_user = db.query(User).filter_by(username="testteacher").first()
        if not teacher_user:
            teacher_user = User(
                username="testteacher",
                full_name="Mr. T. Phiri",
                role="teacher",
                hashed_password=hash_password("teacher1234"),
                is_active=True,
            )
            db.add(teacher_user)
            db.flush()
            profile = TeacherProfile(
                user_id=teacher_user.id,
                subjects_taught="",
                classes_assigned="7A,8B",
                phone="+260977111111",
                bio="Experienced mathematics teacher with 10 years of service.",
                approval_status="approved",
            )
            db.add(profile)
            print("Created test teacher — username: testteacher / password: teacher1234")

        # ── Test Parent ───────────────────────────────────────────────────────
        # Only add a sample student first so we can link the parent
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
            print(f"Created sample student: {student.first_name} {student.last_name}")

        parent_user = db.query(User).filter_by(username="+260971234567").first()
        if not parent_user:
            parent_user = User(
                username="+260971234567",
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
                phone="+260971234567",
                hashed_pin=hash_password("123456"),
                approval_status="approved",
            )
            db.add(parent_profile)
            print("Created test parent — phone: +260971234567 / PIN: 123456")

        db.commit()
        print("\n✅ Database initialized successfully!")
        print("─" * 40)
        print("Default credentials:")
        print("  Admin:   admin / schola2024")
        print("  Teacher: testteacher / teacher1234")
        print("  Parent:  +260971234567 / PIN: 123456")
        print("─" * 40)
        print("⚠  CHANGE THE ADMIN PASSWORD IMMEDIATELY IN PRODUCTION!")

    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init()
