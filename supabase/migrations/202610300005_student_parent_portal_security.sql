-- SmartSchola student and parent portal security.
-- Existing school-wide student read policies are replaced with staff-scoped and
-- relationship-scoped access. Student/guardian accounts are linked only by staff RPCs.

-- Composite key is used to make every guardian/student relationship tenant-safe.
create unique index if not exists students_id_school_unique
  on public.students (id, school_id);

create unique index if not exists school_memberships_id_school_unique
  on public.school_memberships (id, school_id);

create unique index if not exists students_membership_unique
  on public.students (membership_id)
  where membership_id is not null;

create table if not exists public.student_guardians (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid not null,
  guardian_membership_id uuid not null,
  relationship text not null default 'parent'
    check (relationship in ('mother','father','guardian','grandparent','other')),
  is_primary boolean not null default false,
  status text not null default 'active'
    check (status in ('pending','active','revoked')),
  linked_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint student_guardians_student_school_fk
    foreign key (student_id, school_id)
    references public.students(id, school_id) on delete cascade,
  constraint student_guardians_membership_school_fk
    foreign key (guardian_membership_id, school_id)
    references public.school_memberships(id, school_id) on delete cascade,
  constraint student_guardians_unique_link
    unique (school_id, student_id, guardian_membership_id)
);

create index if not exists student_guardians_guardian_idx
  on public.student_guardians (school_id, guardian_membership_id, status);
create index if not exists student_guardians_student_idx
  on public.student_guardians (school_id, student_id, status);

-- Validate the student account link whenever a student record is changed.
create or replace function public.validate_student_membership_link()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.membership_id is not null and not exists (
    select 1 from public.school_memberships m
    where m.id = new.membership_id
      and m.school_id = new.school_id
      and m.role = 'student'
      and m.status = 'active'
  ) then
    raise exception 'Student account must be an active student membership in this school'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists students_membership_link_guard on public.students;
create trigger students_membership_link_guard
  before insert or update of membership_id, school_id on public.students
  for each row execute function public.validate_student_membership_link();

-- A guardian link can only point to an active parent membership in the same school.
create or replace function public.validate_student_guardian_link()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.school_memberships m
    where m.id = new.guardian_membership_id
      and m.school_id = new.school_id
      and m.role = 'parent'
      and m.status = 'active'
  ) then
    raise exception 'Guardian account must be an active parent membership in this school'
      using errcode = '23514';
  end if;
  if not public.has_school_role(new.school_id, array['headmaster','admin']) then
    raise exception 'Only a headmaster or school administrator can approve guardian links'
      using errcode = '42501';
  end if;
  new.linked_by := (select auth.uid());
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists student_guardians_validate on public.student_guardians;
create trigger student_guardians_validate
  before insert or update on public.student_guardians
  for each row execute function public.validate_student_guardian_link();

-- Relationship helpers are security-definer to avoid recursive RLS evaluation.
create or replace function public.is_linked_student(target_student uuid, target_school uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.students s
    join public.school_memberships m on m.id = s.membership_id
    where s.id = target_student
      and s.school_id = target_school
      and m.school_id = target_school
      and m.user_id = (select auth.uid())
      and m.role = 'student'
      and m.status = 'active'
  );
$$;

create or replace function public.is_student_guardian(target_student uuid, target_school uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.student_guardians sg
    join public.school_memberships m on m.id = sg.guardian_membership_id
    where sg.student_id = target_student
      and sg.school_id = target_school
      and sg.status = 'active'
      and m.school_id = target_school
      and m.user_id = (select auth.uid())
      and m.role = 'parent'
      and m.status = 'active'
  );
$$;

create or replace function public.can_view_student_score(target_student uuid, target_school uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select public.is_linked_student(target_student, target_school)
      or public.is_student_guardian(target_student, target_school);
$$;

revoke all on function public.is_linked_student(uuid, uuid) from public;
revoke all on function public.is_student_guardian(uuid, uuid) from public;
revoke all on function public.can_view_student_score(uuid, uuid) from public;
grant execute on function public.is_linked_student(uuid, uuid) to authenticated;
grant execute on function public.is_student_guardian(uuid, uuid) to authenticated;
grant execute on function public.can_view_student_score(uuid, uuid) to authenticated;

-- Link an already authenticated Supabase user to an existing student record.
-- Staff must supply the user's Auth UUID; the RPC never accepts a client role.
create or replace function public.link_student_account(target_student uuid, target_user uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_school uuid;
  target_membership uuid;
  existing_membership public.school_memberships%rowtype;
begin
  select s.school_id into target_school
  from public.students s
  where s.id = target_student;

  if target_school is null then
    raise exception 'Student record not found';
  end if;
  if not public.has_school_role(target_school, array['headmaster','admin']) then
    raise exception 'Only a headmaster or school administrator can link student accounts'
      using errcode = '42501';
  end if;

  select * into existing_membership
  from public.school_memberships m
  where m.school_id = target_school and m.user_id = target_user;

  if found then
    if existing_membership.role <> 'student' then
      raise exception 'This user already has a different role in this school';
    end if;
    if existing_membership.status <> 'active' then
      raise exception 'The student membership is not active';
    end if;
    target_membership := existing_membership.id;
  else
    insert into public.school_memberships(school_id, user_id, role, status, granted_by)
    values (target_school, target_user, 'student', 'active', (select auth.uid()))
    returning id into target_membership;
  end if;

  update public.students
  set membership_id = target_membership
  where id = target_student and school_id = target_school;

  return target_membership;
end;
$$;

-- Link an already authenticated parent/guardian account to one student.
-- Only school leadership can approve this relationship.
create or replace function public.link_parent_to_student(
  target_student uuid,
  target_user uuid,
  guardian_relationship text default 'parent'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_school uuid;
  target_membership uuid;
  guardian_link_id uuid;
  existing_membership public.school_memberships%rowtype;
begin
  select s.school_id into target_school
  from public.students s
  where s.id = target_student;

  if target_school is null then
    raise exception 'Student record not found';
  end if;
  if not public.has_school_role(target_school, array['headmaster','admin']) then
    raise exception 'Only a headmaster or school administrator can approve parent links'
      using errcode = '42501';
  end if;
  if guardian_relationship not in ('mother','father','guardian','grandparent','other') then
    raise exception 'Choose a valid guardian relationship';
  end if;

  select * into existing_membership
  from public.school_memberships m
  where m.school_id = target_school and m.user_id = target_user;

  if found then
    if existing_membership.role <> 'parent' then
      raise exception 'This user already has a different role in this school';
    end if;
    if existing_membership.status <> 'active' then
      raise exception 'The parent membership is not active';
    end if;
    target_membership := existing_membership.id;
  else
    insert into public.school_memberships(school_id, user_id, role, status, granted_by)
    values (target_school, target_user, 'parent', 'active', (select auth.uid()))
    returning id into target_membership;
  end if;

  insert into public.student_guardians(
    school_id, student_id, guardian_membership_id, relationship, status, linked_by
  )
  values (
    target_school, target_student, target_membership, guardian_relationship, 'active', (select auth.uid())
  )
  on conflict (school_id, student_id, guardian_membership_id)
  do update set relationship = excluded.relationship, status = 'active',
                linked_by = excluded.linked_by, updated_at = now()
  returning id into guardian_link_id;

  return guardian_link_id;
end;
$$;

revoke all on function public.link_student_account(uuid, uuid) from public;
revoke all on function public.link_parent_to_student(uuid, uuid, text) from public;
grant execute on function public.link_student_account(uuid, uuid) to authenticated;
grant execute on function public.link_parent_to_student(uuid, uuid, text) to authenticated;

alter table public.student_guardians enable row level security;

drop policy if exists students_school_read on public.students;
drop policy if exists students_staff_write on public.students;
drop policy if exists students_staff_read_secure on public.students;
create policy students_staff_read_secure on public.students
for select to authenticated
using (
  public.has_school_role(school_id, array['headmaster','admin'])
  or (
    public.has_school_role(school_id, array['teacher'])
    and public.can_teach_class(school_id, class_id)
  )
  or public.is_linked_student(id, school_id)
  or public.is_student_guardian(id, school_id)
);

drop policy if exists students_staff_insert_secure on public.students;
create policy students_staff_insert_secure on public.students
for insert to authenticated
with check (
  public.has_school_role(school_id, array['headmaster','admin'])
  or (
    public.has_school_role(school_id, array['teacher'])
    and public.can_teach_class(school_id, class_id)
  )
);

drop policy if exists students_staff_update_secure on public.students;
create policy students_staff_update_secure on public.students
for update to authenticated
using (
  public.has_school_role(school_id, array['headmaster','admin'])
  or (
    public.has_school_role(school_id, array['teacher'])
    and public.can_teach_class(school_id, class_id)
  )
)
with check (
  public.has_school_role(school_id, array['headmaster','admin'])
  or (
    public.has_school_role(school_id, array['teacher'])
    and public.can_teach_class(school_id, class_id)
  )
);

drop policy if exists students_staff_delete_secure on public.students;
create policy students_staff_delete_secure on public.students
for delete to authenticated
using (public.has_school_role(school_id, array['headmaster','admin']));

-- Guardians can see only their own approved links; school staff can manage links.
drop policy if exists student_guardians_read_related on public.student_guardians;
create policy student_guardians_read_related on public.student_guardians
for select to authenticated
using (
  public.has_school_role(school_id, array['headmaster','admin','teacher'])
  or public.is_student_guardian(student_id, school_id)
);

drop policy if exists student_guardians_manage_admin on public.student_guardians;
create policy student_guardians_manage_admin on public.student_guardians
for all to authenticated
using (public.has_school_role(school_id, array['headmaster','admin']))
with check (public.has_school_role(school_id, array['headmaster','admin']));

-- Students and parents see published assessments only for the linked learner's class.
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
        select sg.student_id from public.student_guardians sg
        where sg.school_id = assessments.school_id
          and sg.status = 'active'
          and public.is_student_guardian(sg.student_id, sg.school_id)
        union
        select st.id from public.students st
        where public.is_linked_student(st.id, st.school_id)
      )
      and s.school_id = assessments.school_id
      and s.class_id = assessments.class_id
    )
  )
);

-- Published marks are visible only to the learner, linked guardian, or authorised staff.
drop policy if exists assessment_scores_read_authorized on public.assessment_scores;
create policy assessment_scores_read_authorized on public.assessment_scores
for select to authenticated
using (
  public.has_school_role(school_id, array['headmaster','admin'])
  or public.can_manage_assessment(assessment_id)
  or (
    public.can_view_student_score(student_id, school_id)
    and exists (
      select 1 from public.assessments a
      where a.id = assessment_scores.assessment_id
        and a.school_id = assessment_scores.school_id
        and a.status = 'published'
    )
  )
);

revoke all on public.student_guardians from anon;
grant select on public.student_guardians to authenticated;
grant select, insert, update, delete on public.student_guardians to authenticated;

comment on table public.student_guardians is
  'Approved school-scoped parent/guardian links to student records.';
