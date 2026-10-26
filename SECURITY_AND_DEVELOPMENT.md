# SmartSchola Engineering Baseline

## Current status

This document records initial hardening work. It is not a production-security certification. All changes must pass automated tests and be reviewed before production use.

## Architecture

- React frontend(s) call the FastAPI API; browsers must never receive database credentials.
- FastAPI validates input, authenticates users, enforces permissions, and performs database operations.
- SQLAlchemy manages database access.
- PostgreSQL is the intended production database. SQLite is for local development and isolated tests only.
- Alembic is the intended versioned database migration tool.
- Production deployments must use explicit environment variables and exact frontend origins.

## Environment variables

Required for production:
- `ENVIRONMENT=production`
- `DATABASE_URL`: managed PostgreSQL connection string, with TLS requirements appropriate to the provider
- `SECRET_KEY`: randomly generated secret, at least 32 characters, stored only in the hosting secret manager
- `ALLOWED_ORIGINS`: comma-separated list of exact HTTPS frontend origins

Do not put actual secrets in GitHub, frontend variables, issue reports, screenshots, or logs. If a secret was committed, rotate it; removing it from the latest file does not remove it from Git history.

For local development, copy `backend/.env.example` to `backend/.env` and replace the example values. The local JWT key is ephemeral if not configured, so local tokens are invalidated after process restart.

## Initial administrator provisioning

Run the backend administrator provisioning script only after configuring a private database and these variables: `ADMIN_EMAIL`, `ADMIN_FULL_NAME`, and `ADMIN_INITIAL_PASSWORD`. The script contains no hardcoded default password. Never use example credentials in production.

Public self-registration is restricted to the least-privileged `student` role. Staff and administrator accounts must be created through a separately authorised provisioning process. Do not add a public role selector that is trusted by the backend.

## Database and personal data

- Never commit local SQLite databases, exports, or real school records.
- The existing tracked database must be assessed separately. Ignore rules do not remove a file already tracked by Git or purge it from history.
- Use synthetic fixtures for tests.
- Do not migrate personal data until the database has been inspected and an authorised migration/backup plan exists.
- Production needs managed PostgreSQL, least-privilege credentials, tested backups, restore procedures, retention rules, and a documented incident response plan.

## Running locally

From `backend/`:
1. Create and activate a Python virtual environment.
2. Install `requirements.txt`.
3. Copy `.env.example` to `.env` and set local values.
4. Run `uvicorn main:app --reload`.
5. Open `/docs` locally to inspect the API.

Do not run against a production database while developing or running tests.

## Testing and release

- Install `requirements-dev.txt` and run `pytest` from the repository root.
- Build each frontend separately with its own package manager.
- Review migrations before applying them to any shared database.
- Deploy only after CI checks pass and staging smoke tests are completed.
- Confirm that the deployed frontend origin is listed in `ALLOWED_ORIGINS`.

## Known remaining work

This hardening change does not finish SmartSchola's product features. The repository still requires a complete audit of all API modules, frontend/API contract alignment, implementation of placeholder modules, a formal data model and migrations, PostgreSQL integration tests, school-level data isolation tests, verified ECZ grading rules, parent relationship verification, financial auditability, provider integrations, accessibility checks, backup restoration drills, and an independent security review.

Do not put real student information into the system until those requirements are addressed and the system is explicitly approved for a controlled pilot.
