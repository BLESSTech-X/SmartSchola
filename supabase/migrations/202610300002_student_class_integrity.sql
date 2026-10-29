-- Enforce tenant-safe student-to-class links.
-- Existing students remain intact; unassigned/legacy class labels are preserved.

create unique index if not exists classes_id_school_unique
  on public.classes (id, school_id);

create index if not exists students_school_class_link_idx
  on public.students (school_id, class_id);

create or replace function public.enforce_student_class_school()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.class_id is not null and not exists (
    select 1 from public.classes c
    where c.id = new.class_id and c.school_id = new.school_id
  ) then
    raise exception 'The selected class does not belong to this school'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists students_class_school_guard on public.students;
create trigger students_class_school_guard
  before insert or update of class_id, school_id on public.students
  for each row execute function public.enforce_student_class_school();

comment on column public.students.class_id is
  'Structured class assignment; database trigger enforces that the class belongs to the same school.';
