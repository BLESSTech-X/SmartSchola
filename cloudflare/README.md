# SmartSchola Cloudflare migration

This introduces the Cloudflare D1 + Workers + R2 replacement foundation. It intentionally does not delete Supabase or the legacy FastAPI service. Keep both available until the remaining frontend and API routes have been migrated and cutover tests pass.

## What is included

- `migrations/0001_smartschola_core.sql`: D1 schema carrying the existing tenant model: users/profiles, schools, memberships, sessions, login throttling, reset-token records, academic years, classes, students, class-teacher assignments, assessments, scores, guardian links, student account links, parent/student links, platform admins and audit logs.
- `src/index.js`: Cloudflare Worker API foundation: health, verified school directory, account registration, school-scoped login, session validation/logout, pending school registration and aggregate platform metrics.
- `wrangler.toml`: D1 and R2 bindings.

**This is not yet a drop-in replacement for every Supabase query/RPC or every legacy FastAPI route.** Do not change the production frontend API URL or disable Supabase until the remaining routes and screens are ported and verified.

## 1. Create Cloudflare resources

Run from the repository root:

```bash
npm install -g wrangler
wrangler login
wrangler d1 create smartschola-core
wrangler r2 bucket create smartschola-files
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

The Worker is configured with an R2 binding named `SCHOOL_FILES`; R2 upload/download API routes still need to be implemented with authenticated school/object ownership checks. Never expose R2 credentials in the browser.

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

1. Port all frontend Supabase calls/RPCs: school registration/profile, membership approvals, school verification/suspension, student CRUD, classes, academic years, assessments, marks, student/parent linking, portal access and platform admin controls.
2. Port legacy FastAPI features still used: fees, reports, SMS, dashboard, settings and account recovery.
3. Implement SMTP/email recovery and authenticated R2 upload/download routes.
4. Add automated tenant-isolation and role tests, including student/parent privacy and score validation.
5. Choose one canonical frontend deployment. The repository architecture notes identify `smartschola-frontend/` as the GitHub Pages target; `frontend/` is a separate legacy app.
6. Point the canonical frontend to the Worker only after API parity and staging checks pass. Then remove the Supabase SDK/config and retire the old API. Revoke Supabase credentials only after successful cutover.

## Implemented routes

- `GET /health`
- `GET /api/schools`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `POST /api/schools/register`
- `GET /api/platform/metrics`

D1 has no PostgreSQL RLS. All access must go through authenticated Worker handlers with explicit school and role checks. A browser-supplied school ID is never authorization.
