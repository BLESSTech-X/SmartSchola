# SmartSchola Cloudflare migration

This introduces the Cloudflare D1 + Workers replacement foundation. It intentionally does not delete Supabase or the legacy FastAPI service. Keep both available until the remaining frontend and API routes have been migrated and cutover tests pass.

## What is included

- `migrations/0001_smartschola_core.sql`: D1 schema carrying the existing tenant model: users/profiles, schools, memberships, sessions, login throttling, reset-token records, academic years, classes, students, class-teacher assignments, assessments, scores, guardian links, student account links, parent/student links, platform admins and audit logs.
- `src/index.js`: Cloudflare Worker API foundation: health, verified school directory, account registration, school-scoped login, session validation/logout, pending school registration and aggregate platform metrics.
- `migrations/0003_school_operations.sql`: terms, subjects, attendance, fees, invoices, payments, announcements, events, notifications, audit events, school settings, timetable, admissions and subscription records.
- `wrangler.toml`: D1 binding only; object storage is deliberately deferred.

**This is not yet a drop-in replacement for every Supabase query/RPC or every legacy FastAPI route.** Do not change the production frontend API URL or disable Supabase until the remaining routes and screens are ported and verified.

## 1. Create Cloudflare resources

Run from the repository root:

```bash
npm install -g wrangler
wrangler login
# The existing smartschola-core database is already configured in wrangler.toml.
```

Copy the returned D1 `database_id` into `cloudflare/wrangler.toml`. Set `ALLOWED_ORIGINS` to the exact production frontend origin(s), comma-separated. Never use a wildcard with credentialed requests.

## 2. Apply the SQL migration

```bash
cd cloudflare
wrangler d1 migrations apply smartschola-core --remote
```

Local development:

```bash
wrangler d1 migrations apply smartschola-core --local
wrangler dev
```

The SQL file is SQLite/D1 SQL. Do not paste it into Supabase SQL Editor.

## 3. Deploy the Worker

```bash
wrangler deploy
```

File/object uploads are not enabled in this phase. Do not configure an R2 binding or expose public upload URLs. For now, store only approved external media URLs or defer uploads until an affordable storage option is selected.

## 4. Bootstrap the platform owner

Create the first account with `POST /api/auth/register`, then inspect the new user ID in the Cloudflare D1 console:

```sql
SELECT id,email,full_name FROM users ORDER BY created_at;
```

Insert only the verified owner account (replace the ID):

```sql
INSERT INTO platform_admins(user_id,role,status,created_by)
VALUES('REPLACE_WITH_VERIFIED_USER_ID','owner','active',NULL);
```

Never expose owner provisioning through a public endpoint.

## 5. Smoke tests

```bash
curl https://YOUR-WORKER.workers.dev/health
curl https://YOUR-WORKER.workers.dev/api/schools
curl -X POST https://YOUR-WORKER.workers.dev/api/auth/register \
  -H 'content-type: application/json' \
  -d '{"email":"owner@example.com","full_name":"Platform Owner","password":"REPLACE_WITH_A_LONG_UNIQUE_PASSWORD"}'
```

Login requires an active membership in a verified school. School registration creates a pending school and active headmaster membership; a trusted platform operator must verify the school before school-scoped login is enabled.

## 6. Existing Supabase data and passwords

Take a full encrypted backup before exporting anything. Export tables from Supabase or use `pg_dump`; import parent tables before dependent tables and retain UUID values. Never commit real student records, exports, or secrets to Git.

Supabase Auth password hashes are not compatible with the Worker's PBKDF2 format. Do not copy auth rows or claim existing passwords will work. For imported accounts, require a verified password reset, or implement and security-review a temporary legacy hash verifier before cutover.

## 7. Required before full cutover

1. Implement and test Worker endpoints for every new table/module in `0003_school_operations.sql` and port all frontend Supabase calls/RPCs: school registration/profile, membership approvals, school verification/suspension, student CRUD, classes, academic years, assessments, marks, student/parent linking, portal access and platform admin controls.
2. Port legacy FastAPI features still used: fees, reports, SMS, dashboard, settings and account recovery.
3. Implement SMTP/email recovery and select an affordable, authenticated file-storage option before enabling uploads.
4. Add automated tenant-isolation and role tests, including student/parent privacy and score validation.
5. Choose one canonical frontend deployment. The repository architecture notes identify `smartschola-frontend/` as the GitHub Pages target; `frontend/` is a separate legacy app.
6. Point the canonical frontend to the Worker only after API parity and staging checks pass. Then remove the Supabase SDK/config and retire the old API. Revoke Supabase credentials only after successful cutover.

## Implemented routes (current migration branch)

- `GET /health`
- `GET /api/schools`
- `POST /api/auth/register` (creates a setup session)
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `POST /api/schools/register`
- `GET|POST /api/academic-years`
- `GET|POST /api/classes`
- `GET|POST /api/students`
- `GET|POST /api/subjects`
- `GET|POST /api/assessments`
- `GET|POST /api/assessments/:id/scores`
- `GET|POST /api/attendance/sessions`
- `GET|POST /api/attendance/sessions/:id/records`
- `GET|POST /api/fees/invoices`
- `POST /api/fees/invoices/:id/payments`
- `GET /api/platform/schools`
- `PATCH /api/platform/schools/:id/status`
- `GET /api/platform/metrics`

The routes above are the first API coverage batch, not complete feature parity. Guardian approval/portal privacy, account recovery, school settings, timetable management, public CMS, subscription enforcement, file uploads and remaining legacy workflows still need their handlers and end-to-end tests.

D1 has no PostgreSQL RLS. All access must go through authenticated Worker handlers with explicit school and role checks. A browser-supplied school ID is never authorization.
