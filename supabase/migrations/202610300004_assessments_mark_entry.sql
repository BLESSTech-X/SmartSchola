-- SmartSchola assessments and mark-entry foundation.
-- Every record is tenant-scoped. Teachers can work only in classes explicitly assigned to them.

create unique index if not exists school_memberships_id_school_unique
  on public.school_memberships (id, school_id);

create unique index if not exists students_id_school_unique
  on public.students (id, school_id);

create table if not exists public.class_teachers (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  class_id uuid not null,
  membership_id uuid not null,
  assigned_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  constraint class_teachers_class_school_fk
    foreign key (class_id, school_id)
    references public.classes(id, school_id) on delete cascade,
  constraint class_teachers_membership_school_fk
    foreign key (membership_id, school_id)
    references public.school_memberships(id, school_id) on delete cascade,
  constraint class_teachers_unique_assignment unique (school_id, class_id, membership_id)
);

create index if not exists class_teachers_membership_idx
  on public.class_teachers (school_id, membership_id);

create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  class_id uuid not null,
  academic_year_id uuid,
  name text not null check (char_length(trim(name)) between 2 and 160),
  subject text not null check (char_length(trim(subject)) between 1 and 100),
  assessment_type text not null default 'class_test'
    check (assessment_type in ('class_test','homework','quiz','mid_term','end_term','project','practical','other')),
  term text,
  assessment_date date,
  max_score numeric(8,2) not null check (max_score > 0),
  status text not null default 'draft' check (status in ('draft','published')),
  instructions text not null default '',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assessments_class_school_fk
    foreign key (class_id, school_id)
    references public.classes(id, school_id) on delete cascade,
  constraint assessments_year_fk
    foreign key (academic_year_id)
    references public.academic_years(id) on delete set null
);

create index if not exists assessments_school_class_date_idx
  on public.assessments (school_id, class_id, assessment_date desc);

create unique index if not exists assessments_id_school_unique
  on public.assessments (id, school_id);

create table if not exists public.assessment_scores (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  assessment_id uuid not null,
  student_id uuid not null,
  score numeric(8,2),
  remarks text not null default '',
  entered_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assessment_scores_assessment_school_fk
    foreign key (assessment_id, school_id)
    references public.assessments(id, school_id) on delete cascade,
  constraint assessment_scores_student_school_fk
    foreign key (student_id, school_id)
    references public.students(id, school_id) on delete cascade,
  constraint assessment_scores_unique_student unique (assessment_id, student_id),
  constraint assessment_scores_nonnegative check (score is null or score >= 0)
);

create index if not exists assessment_scores_school_assessment_idx
  on public.assessment_scores (school_id, assessment_id);

-- The assessment composite key is created before assessment_scores references it.

create or replace function public.can_teach_class(target_school uuid, target_class uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.class_teachers ct
    join public.school_memberships m on m.id = ct.membership_id
    where ct.school_id = target_school
      and ct.class_id = target_class
      and m.user_id = (select auth.uid())
      and m.status = 'active'
      and m.role = 'teacher'
  );
$$;

create or replace function public.can_manage_assessment(target_assessment uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.assessments a
    where a.id = target_assessment
      and (
        public.has_school_role(a.school_id, array['headmaster','admin'])
        or public.can_teach_class(a.school_id, a.class_id)
      )
  );
$$;

revoke all on function public.can_teach_class(uuid, uuid) from public;
revoke all on function public.can_manage_assessment(uuid) from public;
grant execute on function public.can_teach_class(uuid, uuid) to authenticated;
grant execute on function public.can_manage_assessment(uuid) to authenticated;

-- Validate a teacher assignment is only granted to an active teacher in this school.
create or replace function public.validate_class_teacher_assignment()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.school_memberships m
    where m.id = new.membership_id
      and m.school_id = new.school_id
      and m.role = 'teacher'
      and m.status = 'active'
  ) then
    raise exception 'Only an active teacher from this school can be assigned to a class'
      using errcode = '23514';
  end if;
  if not public.has_school_role(new.school_id, array['headmaster','admin']) then
    raise exception 'Only a headmaster or school administrator can assign teachers'
      using errcode = '42501';
  end if;
  new.assigned_by := (select auth.uid());
  return new;
end;
$$;

drop trigger if exists class_teachers_validate on public.class_teachers;
create trigger class_teachers_validate
  before insert or update on public.class_teachers
  for each row execute function public.validate_class_teacher_assignment();

-- Validate score against the assessment maximum and require student to belong to its class.
create or replace function public.validate_assessment_score()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  target_class uuid;
  target_max numeric(8,2);
begin
  select a.class_id, a.max_score
    into target_class, target_max
  from public.assessments a
  where a.id = new.assessment_id and a.school_id = new.school_id;

  if target_class is null then
    raise exception 'Assessment not found in this school';
  end if;

  if not exists (
    select 1 from public.students s
    where s.id = new.student_id
      and s.school_id = new.school_id
      and s.class_id = target_class
  ) then
    raise exception 'Student must belong to the class for this assessment'
      using errcode = '23514';
  end if;

  if new.score is not null and new.score > target_max then
    raise exception 'Score cannot exceed the assessment maximum of %', target_max
      using errcode = '23514';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists assessment_scores_validate on public.assessment_scores;
create trigger assessment_scores_validate
  before insert or update on public.assessment_scores
  for each row execute function public.validate_assessment_score();

alter table public.class_teachers enable row level security;
alter table public.assessments enable row level security;
alter table public.assessment_scores enable row level security;

drop policy if exists class_teachers_read_school on public.class_teachers;
create policy class_teachers_read_school on public.class_teachers
for select to authenticated
using (public.is_school_member(school_id));

drop policy if exists class_teachers_manage_admin on public.class_teachers;
create policy class_teachers_manage_admin on public.class_teachers
for all to authenticated
using (public.has_school_role(school_id, array['headmaster','admin']))
with check (public.has_school_role(school_id, array['headmaster','admin']));

drop policy if exists assessments_read_school on public.assessments;
create policy assessments_read_school on public.assessments
for select to authenticated
using (public.is_school_member(school_id));

drop policy if exists assessments_staff_manage on public.assessments;
create policy assessments_staff_manage on public.assessments
for all to authenticated
using (
  public.has_school_role(school_id, array['headmaster','admin'])
  or public.can_teach_class(school_id, class_id)
)
with check (
  public.has_school_role(school_id, array['headmaster','admin'])
  or public.can_teach_class(school_id, class_id)
);

drop policy if exists assessment_scores_read_school on public.assessment_scores;
create policy assessment_scores_read_school on public.assessment_scores
for select to authenticated
using (public.is_school_member(school_id));

drop policy if exists assessment_scores_staff_manage on public.assessment_scores;
create policy assessment_scores_staff_manage on public.assessment_scores
for all to authenticated
using (public.can_manage_assessment(assessment_id))
with check (public.can_manage_assessment(assessment_id));

revoke all on public.class_teachers, public.assessments, public.assessment_scores from anon;
grant select, insert, update, delete on public.class_teachers,
  public.assessments, public.assessment_scores to authenticated;

comment on table public.class_teachers is
  'Explicit class-level teaching assignments; only headmasters/admins can grant them.';
comment on table public.assessments is
  'School- and class-scoped assessments. Teachers must be assigned to the class.';
comment on table public.assessment_scores is
  'Student scores validated against assessment maximum and class membership.';
