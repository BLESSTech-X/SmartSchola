# SmartSchola portal account invitation function

This function invites a student or parent through Supabase Auth and creates the matching school membership. It must run on Supabase Edge Functions; never move the service-role key into the frontend.

## Required Supabase configuration

1. In Supabase Dashboard → Authentication → URL Configuration, make sure the following URL is allowed as a redirect:
   `https://blesstech-x.github.io/SmartSchola/reset-password`
2. In Supabase Dashboard → Edge Functions → Secrets, add:
   - `SMARTSCHOLA_SITE_URL` = `https://blesstech-x.github.io`
3. Supabase provides `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to deployed Edge Functions. Do not expose the service-role key in GitHub or browser code.

## Deploy

Install the Supabase CLI and authenticate, then run from the repository root:

```bash
supabase login
supabase functions deploy provision-portal-account --project-ref gzwlkhdxcptqpqhbuwxd
```

The function uses JWT verification (the Supabase default). It independently verifies the caller's authenticated identity and active headmaster/admin membership before using the server-side admin client to invite an account.

## Operational notes

- Only `student` and `parent` memberships can be created by this endpoint.
- Invited users receive an email invitation and set their own password.
- The invitation creates an active school membership, but student/parent record access remains blocked until the school links the account to the learner record using the secure linking RPCs.
- The headmaster/admin must verify identity and guardian authority before creating a parent link.
- If the invitation email is already registered, the function returns an error rather than attaching an existing identity without verification.


## Platform Command Centre

The platform-wide administration system is separate from school memberships. Apply
`supabase/migrations/202610310002_platform_admin_control_plane.sql` before using
`/platform-admin`.

### Bootstrap the first platform owner

1. Create the intended platform-owner identity through Supabase Authentication (or use
   an existing trusted Supabase Auth account).
2. In the Supabase SQL Editor, replace the email below with that exact account email
   and run this one-time statement:

```sql
insert into public.platform_admins (user_id, role, status, created_by)
select id, 'owner', 'active', null
from auth.users
where lower(email) = lower('YOUR_PLATFORM_OWNER_EMAIL')
on conflict (user_id) do update
set role = 'owner', status = 'active', created_by = null, updated_at = now();
```

3. Confirm exactly one row was inserted or updated. Do not expose the owner's password
   or any service-role credentials.

### Deploy platform school controls

From the repository root, run:

```bash
npx supabase functions deploy platform-admin-control --project-ref gzwlkhdxcptqpqhbuwxd
```

The function uses the Supabase-provided server-side service-role secret and verifies
the caller against `platform_admins` on every request. Only active platform owners
and platform administrators can verify or suspend schools; support accounts are
read-only. School status changes are written to `platform_admin_audit_logs`.

Open the central console at:
`https://blesstech-x.github.io/SmartSchola/platform-admin`

Platform-wide metrics are aggregate counts only. This console does not grant
platform staff direct access to student-level records. Platform administrator
appointments should be made only by the owner through a controlled server-side
administration workflow; never grant roles from browser code or user metadata.
