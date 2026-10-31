-- SmartSchola: secure student and parent identity linking.
-- Staff retain school-wide student access. Student/parent accounts only see explicitly linked records.
-- Run after 202610300004_assessments_mark_entry.sql.

create table if not exists public.student_account_links (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  linked_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  constraint student_account_links_student_school_fk
    foreign key (student_id, school_id)
    references public.students(id, school_id) on delete cascade,
  constraint student_account_links_one_account_per_student unique (school_id, student_id),
  constraint student_account_links_one_student_per_account unique (school_id, user_id)
);

create table if not exists public.parent_student_links (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid not null,
  parent_user_id uuid not null references auth.users(id) on delete cascade,
  relationship text not null default 'parent'
    check (char_length(trim(relationship)) between 2 and 40),
  status text not null default 'pending'
    check (status in ('pending','approved','rejected','revoked')),
  linked_by uuid references auth.users(id),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint parent_student_links_student_school_fk
    foreign key (student_id, school_id)
    references public.students(id, school_id) on delete cascade,
  constraint parent_student_links_unique unique (school_id, student_id, parent_user_id)
);

create index if not exists parent_student_links_parent_idx
  on public.parent_student_links (school_id, parent_user_id, status);
create index if not exists student_account_links_user_idx
  on public.student_account_links (school_id, user_id);

create or replace function public.is_linked_student(target_school uuid, target_student uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.student_account_links l
    where l.school_id = target_school
      and l.student_id = target_student
      and l.user_id = (select auth.uid())
  );
$$;

create or replace function public.is_approved_parent(target_school uuid, target_student uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.parent_student_links l
    where l.school_id = target_school
      and l.student_id = target_student
      and l.parent_user_id = (select auth.uid())
      and l.status = 'approved'
  );
$$;

revoke all on function public.is_linked_student(uuid, uuid) from public;
revoke all on function public.is_approved_parent(uuid, uuid) from public;
grant execute on function public.is_linked_student(uuid, uuid) to authenticated;
grant execute on function public.is_approved_parent(uuid, uuid) to authenticated;

-- Linking is performed only by a headmaster/admin after checking the identity offline.
-- The target account must already have an active membership with the correct role.
create or replace function public.link_student_account(
  target_school uuid,
  target_student uuid,
  target_user uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.has_school_role(target_school, array['headmaster','admin']) then
    raise exception 'Only a headmaster or administrator can link a student account'
      using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.students s
    where s.id = target_student and s.school_id = target_school
  ) then
    raise exception 'Student record not found in this school';
  end if;

  if not exists (
    select 1 from public.school_memberships m
    where m.school_id = target_school
      and m.user_id = target_user
      and m.role = 'student'
      and m.status = 'active'
  ) then
    raise exception 'The account must have an active student membership in this school';
  end if;

  insert into public.student_account_links (school_id, student_id, user_id, linked_by)
  values (target_school, target_student, target_user, (select auth.uid()))
  on conflict (school_id, student_id)
  do update set user_id = excluded.user_id, linked_by = excluded.linked_by, created_at = now();
end;
$$;

create or replace function public.link_parent_to_student(
  target_school uuid,
  target_student uuid,
  target_parent_user uuid,
  target_relationship text default 'parent'
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.has_school_role(target_school, array['headmaster','admin']) then
    raise exception 'Only a headmaster or administrator can verify a parent relationship'
      using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.students s
    where s.id = target_student and s.school_id = target_school
  ) then
    raise exception 'Student record not found in this school';
  end if;

  if not exists (
    select 1 from public.school_memberships m
    where m.school_id = target_school
      and m.user_id = target_parent_user
      and m.role = 'parent'
      and m.status = 'active'
  ) then
    raise exception 'The account must have an active parent membership in this school';
  end if;

  if char_length(trim(coalesce(target_relationship, ''))) not between 2 and 40 then
    raise exception 'Enter a valid relationship';
  end if;

  insert into public.parent_student_links
    (school_id, student_id, parent_user_id, relationship, status, linked_by, reviewed_by, reviewed_at)
  values
    (target_school, target_student, target_parent_user, trim(target_relationship),
     'approved', (select auth.uid()), (select auth.uid()), now())
  on conflict (school_id, student_id, parent_user_id)
  do update set relationship = excluded.relationship, status = 'approved',
    linked_by = excluded.linked_by, reviewed_by = excluded.reviewed_by, reviewed_at = now();
end;
$$;

revoke all on function public.link_student_account(uuid, uuid, uuid) from public;
revoke all on function public.link_parent_to_student(uuid, uuid, uuid, text) from public;
grant execute on function public.link_student_account(uuid, uuid, uuid) to authenticated;
grant execute on function public.link_parent_to_student(uuid, uuid, uuid, text) to authenticated;

alter table public.student_account_links enable row level security;
alter table public.parent_student_links enable row level security;

-- Mapping records are not writable from the browser. Only school staff can inspect them.
drop policy if exists student_account_links_staff_read on public.student_account_links;
create policy student_account_links_staff_read on public.student_account_links
for select to authenticated
using (public.has_school_role(school_id, array['headmaster','admin','teacher']));

drop policy if exists parent_student_links_staff_read on public.parent_student_links;
create policy parent_student_links_staff_read on public.parent_student_links
for select to authenticated
using (public.has_school_role(school_id, array['headmaster','admin','teacher']));

revoke all on public.student_account_links, public.parent_student_links from anon;
revoke all on public.student_account_links, public.parent_student_links from authenticated;
grant select on public.student_account_links, public.parent_student_links to authenticated;

-- Remove the former policy that allowed every school member to read every student.
drop policy if exists students_school_read on public.students;
drop policy if exists students_staff_read on public.students;
create policy students_staff_read on public.students
for select to authenticated
using (public.has_school_role(school_id, array['headmaster','admin','teacher']));

drop policy if exists students_linked_account_read on public.students;
create policy students_linked_account_read on public.students
for select to authenticated
using (
  public.is_linked_student(school_id, id)
  or public.is_approved_parent(school_id, id)
);

-- Staff may still create and maintain student records; student/parent roles cannot.
drop policy if exists students_staff_write on public.students;
create policy students_staff_write on public.students
for all to authenticated
using (public.has_school_role(school_id, array['headmaster','admin','teacher']))
with check (public.has_school_role(school_id, array['headmaster','admin','teacher']));

-- Students and parents can see only published assessments for their linked learner.
drop policy if exists assessments_read_school on public.assessments;
create policy assessments_read_school on public.assessments
for select to authenticated
using (
  public.has_school_role(school_id, array['headmaster','admin','teacher'])
  or (
    status = 'published'
    and exists (
      select 1 from public.students s
      where s.id in (
        select l.student_id from public.student_account_links l
        where l.school_id = assessments.school_id and l.user_id = (select auth.uid())
        union
        select p.student_id from public.parent_student_links p
        where p.school_id = assessments.school_id
          and p.parent_user_id = (select auth.uid()) and p.status = 'approved'
      )
      and s.school_id = assessments.school_id
      and s.class_id = assessments.class_id
    )
  )
);

-- Marks are visible to staff managing the assessment, or the linked student/approved parent
-- after the assessment has been published. Draft marks remain staff-only.
drop policy if exists assessment_scores_read_authorized on public.assessment_scores;
create policy assessment_scores_read_authorized on public.assessment_scores
for select to authenticated
using (
  public.has_school_role(school_id, array['headmaster','admin'])
  or public.can_manage_assessment(assessment_id)
  or (
    exists (
      select 1 from public.assessments a
      where a.id = assessment_scores.assessment_id
        and a.school_id = assessment_scores.school_id
        and a.status = 'published'
    )
    and (
      public.is_linked_student(school_id, student_id)
      or public.is_approved_parent(school_id, student_id)
    )
  )
);

comment on table public.student_account_links is
  'Verified one-to-one mapping from a school student record to an authenticated student account.';
comment on table public.parent_student_links is
  'School-approved parent/guardian relationships. Only approved links grant access to learner records.';
