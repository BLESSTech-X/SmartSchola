-- Ensure each school can have only one current academic year.
-- Date ranges must be valid when both dates are supplied.
create unique index if not exists academic_years_one_current_per_school
  on public.academic_years (school_id)
  where is_current = true;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'academic_years_valid_date_range'
      and conrelid = 'public.academic_years'::regclass
  ) then
    alter table public.academic_years
      add constraint academic_years_valid_date_range
      check (starts_on is null or ends_on is null or starts_on <= ends_on);
  end if;
end $$;

create index if not exists academic_years_school_dates_idx
  on public.academic_years (school_id, starts_on desc);
