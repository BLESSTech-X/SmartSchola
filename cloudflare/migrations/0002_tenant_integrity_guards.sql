-- Tenant-integrity guards carried over from Supabase RLS/trigger protections.
-- All writes still must pass through authenticated Worker routes.

CREATE TRIGGER IF NOT EXISTS classes_year_school_insert
BEFORE INSERT ON classes
WHEN NEW.academic_year_id IS NOT NULL
 AND NOT EXISTS (SELECT 1 FROM academic_years y WHERE y.id=NEW.academic_year_id AND y.school_id=NEW.school_id)
BEGIN SELECT RAISE(ABORT,'Academic year must belong to the same school'); END;

CREATE TRIGGER IF NOT EXISTS classes_year_school_update
BEFORE UPDATE OF academic_year_id,school_id ON classes
WHEN NEW.academic_year_id IS NOT NULL
 AND NOT EXISTS (SELECT 1 FROM academic_years y WHERE y.id=NEW.academic_year_id AND y.school_id=NEW.school_id)
BEGIN SELECT RAISE(ABORT,'Academic year must belong to the same school'); END;

CREATE TRIGGER IF NOT EXISTS students_membership_school_insert
BEFORE INSERT ON students
WHEN NEW.membership_id IS NOT NULL
 AND NOT EXISTS (SELECT 1 FROM school_memberships m WHERE m.id=NEW.membership_id AND m.school_id=NEW.school_id AND m.role='student' AND m.status='active')
BEGIN SELECT RAISE(ABORT,'Student membership must be active and belong to the same school'); END;

CREATE TRIGGER IF NOT EXISTS students_membership_school_update
BEFORE UPDATE OF membership_id,school_id ON students
WHEN NEW.membership_id IS NOT NULL
 AND NOT EXISTS (SELECT 1 FROM school_memberships m WHERE m.id=NEW.membership_id AND m.school_id=NEW.school_id AND m.role='student' AND m.status='active')
BEGIN SELECT RAISE(ABORT,'Student membership must be active and belong to the same school'); END;

CREATE TRIGGER IF NOT EXISTS assessments_year_school_insert
BEFORE INSERT ON assessments
WHEN NEW.academic_year_id IS NOT NULL
 AND NOT EXISTS (SELECT 1 FROM academic_years y WHERE y.id=NEW.academic_year_id AND y.school_id=NEW.school_id)
BEGIN SELECT RAISE(ABORT,'Assessment academic year must belong to the same school'); END;

CREATE TRIGGER IF NOT EXISTS assessments_year_school_update
BEFORE UPDATE OF academic_year_id,school_id ON assessments
WHEN NEW.academic_year_id IS NOT NULL
 AND NOT EXISTS (SELECT 1 FROM academic_years y WHERE y.id=NEW.academic_year_id AND y.school_id=NEW.school_id)
BEGIN SELECT RAISE(ABORT,'Assessment academic year must belong to the same school'); END;

CREATE TRIGGER IF NOT EXISTS class_teacher_membership_insert
BEFORE INSERT ON class_teachers
WHEN NOT EXISTS (SELECT 1 FROM school_memberships m WHERE m.id=NEW.membership_id AND m.school_id=NEW.school_id AND m.role='teacher' AND m.status='active')
BEGIN SELECT RAISE(ABORT,'Only an active teacher from this school can be assigned'); END;

CREATE TRIGGER IF NOT EXISTS class_teacher_membership_update
BEFORE UPDATE OF membership_id,school_id,class_id ON class_teachers
WHEN NOT EXISTS (SELECT 1 FROM school_memberships m WHERE m.id=NEW.membership_id AND m.school_id=NEW.school_id AND m.role='teacher' AND m.status='active')
BEGIN SELECT RAISE(ABORT,'Only an active teacher from this school can be assigned'); END;

CREATE TRIGGER IF NOT EXISTS assessment_scores_validate_insert
BEFORE INSERT ON assessment_scores
WHEN
  NOT EXISTS (
    SELECT 1 FROM assessments a JOIN students s ON s.id=NEW.student_id AND s.school_id=NEW.school_id
    WHERE a.id=NEW.assessment_id AND a.school_id=NEW.school_id AND s.class_id=a.class_id
      AND (NEW.score IS NULL OR NEW.score<=a.max_score)
  )
BEGIN SELECT RAISE(ABORT,'Score must belong to a student in the assessment class and not exceed its maximum'); END;

CREATE TRIGGER IF NOT EXISTS assessment_scores_validate_update
BEFORE UPDATE OF assessment_id,student_id,school_id,score ON assessment_scores
WHEN
  NOT EXISTS (
    SELECT 1 FROM assessments a JOIN students s ON s.id=NEW.student_id AND s.school_id=NEW.school_id
    WHERE a.id=NEW.assessment_id AND a.school_id=NEW.school_id AND s.class_id=a.class_id
      AND (NEW.score IS NULL OR NEW.score<=a.max_score)
  )
BEGIN SELECT RAISE(ABORT,'Score must belong to a student in the assessment class and not exceed its maximum'); END;

CREATE TRIGGER IF NOT EXISTS guardian_membership_validate_insert
BEFORE INSERT ON student_guardians
WHEN NOT EXISTS (SELECT 1 FROM school_memberships m WHERE m.id=NEW.guardian_membership_id AND m.school_id=NEW.school_id AND m.role='parent' AND m.status='active')
BEGIN SELECT RAISE(ABORT,'Guardian must be an active parent membership in this school'); END;

CREATE TRIGGER IF NOT EXISTS guardian_membership_validate_update
BEFORE UPDATE OF guardian_membership_id,school_id ON student_guardians
WHEN NOT EXISTS (SELECT 1 FROM school_memberships m WHERE m.id=NEW.guardian_membership_id AND m.school_id=NEW.school_id AND m.role='parent' AND m.status='active')
BEGIN SELECT RAISE(ABORT,'Guardian must be an active parent membership in this school'); END;

CREATE INDEX IF NOT EXISTS student_guardians_guardian_idx ON student_guardians(school_id,guardian_membership_id,status);
CREATE INDEX IF NOT EXISTS student_guardians_student_idx ON student_guardians(school_id,student_id,status);
CREATE INDEX IF NOT EXISTS student_account_links_user_idx ON student_account_links(school_id,user_id);
