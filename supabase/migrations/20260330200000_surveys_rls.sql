-- Surveys feature: privileges + RLS for surveys, survey_options, survey_responses.
-- "Permission denied for table" is often missing GRANTs or RLS with no policies.

-- ---------------------------------------------------------------------------
-- Privileges (safe if already granted in your project)
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on table public.surveys to authenticated, service_role;
grant select, insert, update, delete on table public.survey_options to authenticated, service_role;
grant select, insert, update, delete on table public.survey_responses to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- surveys
-- Policies assume users can SELECT their own rows from public.trips (trip.creator).
-- If INSERT here still fails, check RLS policies on trips for the same user.
-- ---------------------------------------------------------------------------
alter table public.surveys enable row level security;

drop policy if exists "surveys_select_trip_owner" on public.surveys;
drop policy if exists "surveys_insert_trip_owner" on public.surveys;
drop policy if exists "surveys_update_trip_owner" on public.surveys;
drop policy if exists "surveys_delete_trip_owner" on public.surveys;

create policy "surveys_select_trip_owner"
  on public.surveys
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.trips t
      where t.id = surveys.trip_id
        and t.created_by = (select auth.uid())
    )
  );

create policy "surveys_insert_trip_owner"
  on public.surveys
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.trips t
      where t.id = surveys.trip_id
        and t.created_by = (select auth.uid())
    )
    and surveys.created_by = (select auth.uid())
  );

create policy "surveys_update_trip_owner"
  on public.surveys
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.trips t
      where t.id = surveys.trip_id
        and t.created_by = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.trips t
      where t.id = surveys.trip_id
        and t.created_by = (select auth.uid())
    )
  );

create policy "surveys_delete_trip_owner"
  on public.surveys
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.trips t
      where t.id = surveys.trip_id
        and t.created_by = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- survey_options (scoped to surveys the user’s trips own)
-- ---------------------------------------------------------------------------
alter table public.survey_options enable row level security;

drop policy if exists "survey_options_select_trip_owner" on public.survey_options;
drop policy if exists "survey_options_insert_trip_owner" on public.survey_options;
drop policy if exists "survey_options_update_trip_owner" on public.survey_options;
drop policy if exists "survey_options_delete_trip_owner" on public.survey_options;

create policy "survey_options_select_trip_owner"
  on public.survey_options
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.surveys s
      join public.trips t on t.id = s.trip_id
      where s.id = survey_options.survey_id
        and t.created_by = (select auth.uid())
    )
  );

create policy "survey_options_insert_trip_owner"
  on public.survey_options
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.surveys s
      join public.trips t on t.id = s.trip_id
      where s.id = survey_options.survey_id
        and t.created_by = (select auth.uid())
    )
  );

create policy "survey_options_update_trip_owner"
  on public.survey_options
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.surveys s
      join public.trips t on t.id = s.trip_id
      where s.id = survey_options.survey_id
        and t.created_by = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.surveys s
      join public.trips t on t.id = s.trip_id
      where s.id = survey_options.survey_id
        and t.created_by = (select auth.uid())
    )
  );

create policy "survey_options_delete_trip_owner"
  on public.survey_options
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.surveys s
      join public.trips t on t.id = s.trip_id
      where s.id = survey_options.survey_id
        and t.created_by = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- survey_responses (trip owner sees all; members can insert/read own later)
-- For now: trip owner full access on responses for surveys on their trips.
-- ---------------------------------------------------------------------------
alter table public.survey_responses enable row level security;

drop policy if exists "survey_responses_all_trip_owner" on public.survey_responses;

create policy "survey_responses_all_trip_owner"
  on public.survey_responses
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.surveys s
      join public.trips t on t.id = s.trip_id
      where s.id = survey_responses.survey_id
        and t.created_by = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.surveys s
      join public.trips t on t.id = s.trip_id
      where s.id = survey_responses.survey_id
        and t.created_by = (select auth.uid())
    )
  );
