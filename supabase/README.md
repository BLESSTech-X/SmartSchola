# Supabase setup

SmartSchola uses one Supabase PostgreSQL database with tenant isolation enforced by PostgreSQL Row Level Security (RLS).

## Apply the first migration

1. Open the Supabase project for SmartSchola.
2. Open **SQL Editor** and create a new query.
3. Paste and run `supabase/migrations/202610290001_initial_tenant_schema.sql`.
4. Confirm the migration completes without errors.

## Apply the student register migration

After the initial schema has been applied, run `supabase/migrations/202610300001_student_records.sql` in the Supabase SQL Editor. This adds the register fields used by the frontend (grade, class label, gender, parent phone and address) and a generated student reference. The existing `students` Row Level Security policies continue to scope access to active members of each school.

## Apply the student-to-class integrity migration

After the student register migration, run `supabase/migrations/202610300002_student_class_integrity.sql`. This adds a database guard that rejects assigning a student to a class belonging to another school. Existing student records are preserved; legacy class labels remain visible until each student is assigned to a structured class.

## Apply the academic year rules migration

After the student-to-class integrity migration, run `supabase/migrations/202610300003_academic_year_rules.sql`. This enforces at most one current academic year per school and prevents invalid date ranges. The Academic Years workspace screen then supports creating, editing, selecting the current year, and deleting unused years. A year assigned to a class cannot be deleted until its classes are reassigned.

## Apply the assessments and mark-entry migration

After the academic-year rules migration, run `supabase/migrations/202610300004_assessments_mark_entry.sql` in the Supabase SQL Editor. It creates class-level teacher assignments, assessments and student score records. The database enforces same-school links, restricts teacher assessment access to assigned classes, validates marks against each assessment's maximum score, and limits score visibility to school administrators, assigned staff and the student's own linked account.

This migration creates the database foundation only. The next frontend step is the teacher-assignment and assessment/mark-entry screens. Headmasters or administrators must assign teachers to classes before those teachers can create assessments or enter marks. Existing students can receive individual portal access later by linking their student record to an authenticated school membership.

## Configure the frontend

Set these as GitHub Actions repository **Variables** for the `github-pages` deployment:

- `VITE_SUPABASE_URL` = the Supabase project URL
- `VITE_SUPABASE_ANON_KEY` = the Supabase publishable key

The publishable key is intended for browser use. Never add a Supabase secret key, service-role key, database password, or SMTP password to frontend code or repository variables exposed to the build.

## Current migration boundary

The initial migration creates the secure Supabase foundation: Auth-linked profiles, school registration, school memberships, verified public directory, academic years, classes and students. Follow-up migrations add student register fields, protect student-to-class assignments, enforce academic-year integrity, and add class assignments, assessments and protected student scores. It does not yet replace every legacy FastAPI route or move existing SQLite records. Do not switch off the old API until the frontend flows have been migrated and tested against Supabase.

## School registration and verification

An authenticated user calls the Postgres RPC `register_school` to submit a school. The school is created with status `pending`; the requester receives an active `headmaster` membership. The school remains absent from the public directory until a trusted platform operator verifies it. Do not expose a client-side operation that directly changes `schools.status`.

## Isolation model

Every operational table includes `school_id`. RLS checks membership using the authenticated Supabase user ID. A browser-supplied school ID is only a selector; it never grants access. New school-owned tables must include a non-null `school_id`, enable RLS, and add policies using `is_school_member` / `has_school_role`.
