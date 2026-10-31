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
