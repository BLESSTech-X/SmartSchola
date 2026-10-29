-- SmartSchola Supabase foundation
-- Shared PostgreSQL database; all school-owned rows are protected by RLS.
-- Apply in the Supabase SQL Editor or with: supabase db push

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 180),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  location text not null default '',
  description text not null default '',
  logo_url text,
  cover_url text,
  status text not null default 'pending' check (status in ('pending','verified','suspended')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.school_memberships (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('headmaster','admin','teacher','student','parent')),
  status text not null default 'pending' check (status in ('pending','active','suspended')),
  login_identifier text,
  granted_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (school_id, user_id),
  unique (school_id, login_identifier)
);

create index if not exists school_memberships_user_idx on public.school_memberships(user_id);
create index if not exists school_memberships_school_role_idx on public.school_memberships(school_id, role);

create table if not exists public.academic_years (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  starts_on date,
  ends_on date,
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  unique (school_id, name)
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  academic_year_id uuid references public.academic_years(id) on delete set null,
  class_teacher_id uuid references public.school_memberships(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (school_id, name, academic_year_id)
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  membership_id uuid references public.school_memberships(id) on delete set null,
  student_number text not null,
  first_name text not null,
  last_name text not null,
  class_id uuid references public.classes(id) on delete set null,
  date_of_birth date,
  status text not null default 'active' check (status in ('active','inactive','transferred','graduated')),
  created_at timestamptz not null default now(),
  unique (school_id, student_number)
);

create index if not exists students_school_class_idx on public.students(school_id, class_id);

-- Membership is always derived from the verified Supabase Auth identity.
create or replace function public.is_school_member(target_school uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.school_memberships m
    where m.school_id = target_school
      and m.user_id = (select auth.uid())
      and m.status = 'active'
  );
$$;

create or replace function public.has_school_role(target_school uuid, allowed_roles text[])
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.school_memberships m
    where m.school_id = target_school
      and m.user_id = (select auth.uid())
      and m.status = 'active'
      and m.role = any(allowed_roles)
  );
$$;

revoke all on function public.is_school_member(uuid) from public;
revoke all on function public.has_school_role(uuid, text[]) from public;
grant execute on function public.is_school_member(uuid) to authenticated;
grant execute on function public.has_school_role(uuid, text[]) to authenticated;

-- A new Auth user gets a private profile; role is never accepted from client metadata.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_auth_user();

-- School owners can request registration; new schools remain pending until verified.
create or replace function public.register_school(
  school_name text,
  school_slug text,
  school_location text default ''
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_school_id uuid;
  requester uuid := (select auth.uid());
begin
  if requester is null then
    raise exception 'Authentication required';
  end if;
  if char_length(trim(school_name)) not between 2 and 180 then
    raise exception 'School name must be between 2 and 180 characters';
  end if;
  if school_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
    raise exception 'Use a lowercase URL slug with letters, numbers and hyphens';
  end if;

  insert into public.schools(name, slug, location, created_by)
  values (trim(school_name), school_slug, coalesce(trim(school_location), ''), requester)
  returning id into new_school_id;

  insert into public.school_memberships(school_id, user_id, role, status, granted_by)
  values (new_school_id, requester, 'headmaster', 'active', requester);

  return new_school_id;
end;
$$;

revoke all on function public.register_school(text, text, text) from public;
grant execute on function public.register_school(text, text, text) to authenticated;

alter table public.profiles enable row level security;
alter table public.schools enable row level security;
alter table public.school_memberships enable row level security;
alter table public.academic_years enable row level security;
alter table public.classes enable row level security;
alter table public.students enable row level security;

-- Profiles: a user can view/update only their own profile.
create policy "profile_select_self" on public.profiles
for select to authenticated using (id = (select auth.uid()));
create policy "profile_update_self" on public.profiles
for update to authenticated using (id = (select auth.uid()))
with check (id = (select auth.uid()));

-- Public directory exposes verified school profiles only.
create policy "schools_public_verified" on public.schools
for select to anon, authenticated using (status = 'verified');
create policy "schools_member_read" on public.schools
for select to authenticated using (public.is_school_member(id));
create policy "schools_headmaster_update" on public.schools
for update to authenticated using (public.has_school_role(id, array['headmaster','admin']))
with check (public.has_school_role(id, array['headmaster','admin']));

-- Memberships are visible to members of the same school; only headmasters/admins
-- can manage memberships. A member cannot grant themselves elevated privileges.
create policy "memberships_read_school" on public.school_memberships
for select to authenticated using (public.is_school_member(school_id));
create policy "memberships_manage_school" on public.school_memberships
for all to authenticated
using (public.has_school_role(school_id, array['headmaster','admin']))
with check (public.has_school_role(school_id, array['headmaster','admin']));

create policy "academic_years_school_access" on public.academic_years
for all to authenticated
using (public.is_school_member(school_id))
with check (public.is_school_member(school_id));

create policy "classes_school_access" on public.classes
for all to authenticated
using (public.is_school_member(school_id))
with check (public.is_school_member(school_id));

create policy "students_school_read" on public.students
for select to authenticated using (public.is_school_member(school_id));
create policy "students_staff_write" on public.students
for insert, update, delete to authenticated
using (public.has_school_role(school_id, array['headmaster','admin','teacher']))
with check (public.has_school_role(school_id, array['headmaster','admin','teacher']));

-- Never expose raw tables to unauthenticated callers.
revoke all on public.profiles, public.schools, public.school_memberships,
  public.academic_years, public.classes, public.students from anon;
grant select on public.schools to anon;
grant select, update on public.profiles to authenticated;
grant select, update on public.schools to authenticated;
grant select, insert, update, delete on public.school_memberships,
  public.academic_years, public.classes, public.students to authenticated;

comment on table public.schools is 'Public school directory and tenant control plane. School data access is enforced by RLS.';
comment on table public.school_memberships is 'Authoritative school-scoped roles. Never trust client-supplied role values.';
