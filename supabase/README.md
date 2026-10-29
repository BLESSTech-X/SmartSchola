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

## Configure the frontend

Set these as GitHub Actions repository **Variables** for the `github-pages` deployment:

- `VITE_SUPABASE_URL` = the Supabase project URL
- `VITE_SUPABASE_ANON_KEY` = the Supabase publishable key

The publishable key is intended for browser use. Never add a Supabase secret key, service-role key, database password, or SMTP password to frontend code or repository variables exposed to the build.

## Current migration boundary

The initial migration creates the secure Supabase foundation: Auth-linked profiles, school registration, school memberships, verified public directory, academic years, classes and students. The follow-up student register migration adds the fields required by the current student management screen. The class-integrity migration protects student-to-class assignments at the database level. It does not yet replace every legacy FastAPI route or move existing SQLite records. Do not switch off the old API until the frontend flows have been migrated and tested against Supabase.

## School registration and verification

An authenticated user calls the Postgres RPC `register_school` to submit a school. The school is created with status `pending`; the requester receives an active `headmaster` membership. The school remains absent from the public directory until a trusted platform operator verifies it. Do not expose a client-side operation that directly changes `schools.status`.

## Isolation model

Every operational table includes `school_id`. RLS checks membership using the authenticated Supabase user ID. A browser-supplied school ID is only a selector; it never grants access. New school-owned tables must include a non-null `school_id`, enable RLS, and add policies using `is_school_member` / `has_school_role`.
