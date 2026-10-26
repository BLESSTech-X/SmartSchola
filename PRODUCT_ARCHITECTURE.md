# SmartSchola Product & Architecture Blueprint

## Product definition
SmartSchola is a multi-tenant school community and school-management platform. It combines a public school discovery experience, a configurable public profile for each participating school, private school operations, and role-specific experiences for staff, learners, and parents/guardians.

## Non-negotiable architectural decisions
1. **One application, many schools.** Do not create a separate codebase or database per school.
2. **Tenant isolation is server-enforced.** Every school-owned record must have a school/tenant identifier. The backend derives allowed tenant scope from the authenticated membership; it must never trust a browser-supplied tenant ID alone.
3. **Explicit memberships and roles.** A user may have a membership in one or more schools. Roles and permissions are granted within a school, not assumed globally from a user-supplied role.
4. **Separate platform and school administration.** Platform operators manage SmartSchola; school owners and administrators manage only their own school.
5. **Public and private data are separate.** Public profiles contain only explicitly published content. Student records, results, guardian links, fees and private communications are never exposed through public profile endpoints.
6. **Production authentication only.** No hard-coded shared administrator password or client-only token is acceptable for real schools. Use short-lived access tokens or secure sessions, password hashing, account recovery, rate limits, and revocation.
7. **Database migrations are mandatory.** Schema changes must be versioned, repeatable and safe to apply to a fresh environment and an existing deployment.
8. **Test with multiple fictional tenants.** Automated tests must prove that one school's users cannot read, alter, export or infer another school's private data.
9. **Real feature completion.** A UI action is complete only when the API, validation, permission checks, loading/error/success states and tests are implemented.
10. **No false production claims.** Sample profiles are previews until populated and published by verified schools. External integrations must be configured and tested before being advertised as active.

## Target domain model
- **School/Tenant:** canonical name, unique slug, verification status, subscription state, timezone, locale, contact details, public visibility.
- **SchoolBranding:** logo, cover image, theme tokens, motto, profile sections and published status.
- **User:** identity, normalized email/phone, credential data, account status, recovery and security metadata.
- **Membership:** user, school, membership status, invitation state and scoped role/permissions.
- **Role/Permission:** platform-level permissions separated from school-scoped permissions.
- **Subscription/Entitlement:** plan, status, billing period, feature limits, grace period and audit history.
- **AcademicYear/Term:** school-scoped calendar and active period.
- **Class/Subject/TeachingAssignment:** school-scoped academic structure.
- **Student:** school-scoped learner record and status.
- **GuardianLink:** verified relationship between a guardian account and one or more students, with explicit permissions.
- **Assessment/Mark/Result/ReportCard:** school-scoped assessment rules, validation/approval workflow and published outputs.
- **Attendance:** dated records with actor, class/learner scope and correction audit trail.
- **FeeStructure/Invoice/Payment/Receipt:** school-scoped accounting records with immutable transaction history and reconciliation.
- **Announcement/Event/MediaAsset/Document:** visibility, publication status, author, moderation and access policy.
- **AuditEvent/Notification/Integration:** traceability, delivery state and integration configuration.

## Authentication and school routing
- Public home: `/`
- School public profile: `/s/{school-slug}`
- Sign-in entry: `/login`; can accept a school context from a profile link.
- Authenticated workspace: role- and membership-aware routes.
- Parent and learner portals: separate navigation and permissions, backed by the same identity and school-membership model.
- Custom domains can later resolve to the same tenant routing layer; do not hard-code tenant identity from client-side route data.

## Delivery phases and acceptance gates
### Phase 0 — Repository audit and decisions
Inventory both existing frontends, backend routers/models, dependencies, migrations, tests, deployment and environment configuration. Select a canonical frontend and document API contracts. Do not delete legacy code until dependencies and production usage are understood.

### Phase 1 — Production foundation
Implement tenant-aware schema and migrations, identity/membership model, secure authentication, scoped authorization, tenant-isolation tests, configuration/secrets, error handling, logs, backups and deployment health checks.
**Gate:** two seeded fictional schools can use one deployment and automated tests prove isolation for read/write/export paths.

### Phase 2 — Public community
Build public landing page, verified school directory/search, school-profile CMS, published announcements/events/gallery, contact/admissions enquiries and branding.
**Gate:** an authorised school can publish and edit its own public profile; visitors see only approved public content.

### Phase 3 — School operations
Complete admissions, student/staff records, classes/subjects, timetable, attendance, marks, grading, results/report cards, fees, communications, exports and audit logs.
**Gate:** core workflows work end-to-end against the backend with validation, permission checks and tests.

### Phase 4 — Learner and parent portals
Build guardian linking, child switching, attendance, published results, downloadable report cards, announcements, events, permitted fee views, notifications and account recovery.
**Gate:** automated access tests cover linked and unlinked children, multiple schools and revoked memberships.

### Phase 5 — Commercial operations
Implement school onboarding/verification, subscription plans and entitlements, payment provider integration, renewals, expiry/grace periods, invoices, receipts, platform operations and support workflows.
**Gate:** subscription state controls entitlements on the server; payment events are authenticated and idempotent.

### Phase 6 — Community expansion
Add advanced discovery, inter-school events, educational resources, analytics, custom domains and additional integrations after validating demand.
**Gate:** new capabilities preserve tenant isolation, child privacy and accessibility.

## Current repository findings (2026-10-26)
- The repository contains both `frontend/` and `smartschola-frontend/`; the latter is the current GitHub Pages build target.
- The backend has a FastAPI login endpoint and a simple `User` model, but the inspected model does not yet provide a tenant/membership architecture.
- Public registration currently creates a least-privileged user account, not a verified school tenant or school-owner membership.
- The current dashboard and several modules call APIs; they must not be represented as production-ready until the backend endpoints and real deployment are verified.
- A recent frontend build failed in `smartschola-frontend/src/pages/Students.jsx` because the mobile and desktop list branches returned adjacent JSX nodes. This is fixed by wrapping both in a fragment; the next Actions run must confirm the build.
- GitHub Pages serves the frontend only. The API must be deployed separately and configured via `VITE_API_URL`; the browser-only site cannot itself host the FastAPI backend.
- Existing local SQLite artifacts and any duplicate frontend must be reviewed before production launch; do not delete or migrate them blindly.

## Launch blockers before accepting real schools
- Production API URL and secure environment secrets.
- Tenant-aware database schema and migrations.
- Secure school-owner onboarding and verified school registration.
- School-scoped authorization and cross-tenant security tests.
- Real password recovery/session policy.
- Tested backup/restore and privacy/data-retention policy.
- Tested payment and notification integrations before enabling those claims.
- Production monitoring, support contacts and incident process.
