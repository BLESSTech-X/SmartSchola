-- SmartSchola platform administration control plane
-- Apply after 202610310001_student_parent_access_security.sql.

create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','support')),
  status text not null default 'active' check (status in ('active','suspended')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((role = 'owner' and created_by is null) or role <> 'owner')
);

create index if not exists platform_admins_role_status_idx
  on public.platform_admins(role, status);

create table if not exists public.platform_admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null references auth.users(id),
  action text not null,
  target_type text not null,
  target_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists platform_audit_created_idx
  on public.platform_admin_audit_logs(created_at desc);
create index if not exists platform_audit_actor_idx
  on public.platform_admin_audit_logs(actor_user_id, created_at desc);

create or replace function public.is_platform_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.platform_admins pa
    where pa.user_id = (select auth.uid())
      and pa.status = 'active'
      and pa.role in ('owner','admin','support')
  );
$$;

create or replace function public.has_platform_role(allowed_roles text[])
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.platform_admins pa
    where pa.user_id = (select auth.uid())
      and pa.status = 'active'
      and pa.role = any(allowed_roles)
  );
$$;

revoke all on function public.is_platform_admin() from public;
revoke all on function public.has_platform_role(text[]) from public;
grant execute on function public.is_platform_admin() to authenticated;
grant execute on function public.has_platform_role(text[]) to authenticated;

alter table public.platform_admins enable row level security;
alter table public.platform_admin_audit_logs enable row level security;

-- A platform administrator can inspect their own grant; the server-side
-- control function uses the service role for privileged administration.
drop policy if exists platform_admin_read_self on public.platform_admins;
create policy platform_admin_read_self on public.platform_admins
for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists platform_audit_read_admins on public.platform_admin_audit_logs;
create policy platform_audit_read_admins on public.platform_admin_audit_logs
for select to authenticated using (public.has_platform_role(array['owner','admin']));

drop policy if exists schools_platform_admin_read on public.schools;
create policy schools_platform_admin_read on public.schools
for select to authenticated using (public.is_platform_admin());

revoke all on public.platform_admins, public.platform_admin_audit_logs from anon, authenticated;
grant select on public.platform_admins, public.platform_admin_audit_logs to authenticated;

-- Aggregate operational metrics only; no student names or individual records are
-- returned to the central dashboard.
create or replace function public.platform_dashboard_metrics()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  if not public.is_platform_admin() then
    raise exception 'Platform administrator access required';
  end if;

  select jsonb_build_object(
    'schools_total', (select count(*) from public.schools),
    'schools_pending', (select count(*) from public.schools where status = 'pending'),
    'schools_verified', (select count(*) from public.schools where status = 'verified'),
    'schools_suspended', (select count(*) from public.schools where status = 'suspended'),
    'students_total', (select count(*) from public.students where status = 'active'),
    'teachers_total', (select count(*) from public.school_memberships where role = 'teacher' and status = 'active'),
    'parents_total', (select count(*) from public.school_memberships where role = 'parent' and status = 'active'),
    'school_admins_total', (select count(*) from public.school_memberships where role in ('headmaster','admin') and status = 'active'),
    'classes_total', (select count(*) from public.classes)
  ) into result;
  return result;
end;
$$;

revoke all on function public.platform_dashboard_metrics() from public;
grant execute on function public.platform_dashboard_metrics() to authenticated;

comment on table public.platform_admins is 'Platform-wide authority, separate from school-scoped memberships.';
comment on table public.platform_admin_audit_logs is 'Immutable-by-client audit trail for privileged platform operations.';
