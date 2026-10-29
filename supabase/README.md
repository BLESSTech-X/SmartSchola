# Supabase setup

SmartSchola uses one Supabase PostgreSQL database with tenant isolation enforced by PostgreSQL Row Level Security (RLS).

## Apply the first migration

1. Open the Supabase project for SmartSchola.
2. Open **SQL Editor** and create a new query.
3. Paste and run `supabase/migrations/202610290001_initial_tenant_schema.sql`.
4. Confirm the migration completes without errors.

## Configure the frontend

Set these as GitHub Actions repository **Variables** for the `github-pages` deployment:

- `VITE_SUPABASE_URL` = the Supabase project URL
- `VITE_SUPABASE_ANON_KEY` = the Supabase publishable key

The publishable key is intended for browser use. Never add a Supabase secret key, service-role key, database password, or SMTP password to frontend code or repository variables exposed to the build.

## Current migration boundary

This migration creates the secure Supabase foundation: Auth-linked profiles, school registration, school memberships, verified public directory, academic years, classes and students. It does not yet replace every legacy FastAPI route or move existing SQLite records. Do not switch off the old API until the frontend flows have been migrated and tested against Supabase.

## School registration and verification

An authenticated user calls the Postgres RPC `register_school` to submit a school. The school is created with status `pending`; the requester receives an active `headmaster` membership. The school remains absent from the public directory until a trusted platform operator verifies it. Do not expose a client-side operation that directly changes `schools.status`.

## Isolation model

Every operational table includes `school_id`. RLS checks membership using the authenticated Supabase user ID. A browser-supplied school ID is only a selector; it never grants access. New school-owned tables must include a non-null `school_id`, enable RLS, and add policies using `is_school_member` / `has_school_role`.
