-- Baseline: weekly training times.
-- Run this AFTER 20261013000002_remove_club.sql.
--
-- A slot is a recurring weekly time (for example Tuesday 16:30 to 18:00).
-- An override changes or cancels one date of a slot without touching the rest.
-- Both the player and the coach can change the schedule.

create table public.schedule_slots (
  id uuid primary key default gen_random_uuid(),
  log_id uuid not null references public.logs (id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),  -- 0 = Sunday, like JavaScript
  start_time time not null,
  end_time time,                                              -- a rough finish; optional
  place text not null default '' check (char_length(place) <= 80),
  created_at timestamptz not null default now(),
  check (end_time is null or end_time > start_time),
  unique (id, log_id)
);
create index schedule_slots_log_idx on public.schedule_slots (log_id);

create table public.schedule_overrides (
  id uuid primary key default gen_random_uuid(),
  log_id uuid not null references public.logs (id) on delete cascade,
  slot_id uuid not null,
  on_date date not null,          -- the date the slot would normally fall on
  new_date date,                  -- both new_date and new_start empty = cancelled
  new_start time,
  new_end time,
  created_at timestamptz not null default now(),
  unique (slot_id, on_date),
  check ((new_date is null) = (new_start is null)),
  check (new_end is null or new_start is null or new_end > new_start),
  -- an override can only point at a slot in the same log
  foreign key (slot_id, log_id) references public.schedule_slots (id, log_id) on delete cascade
);
create index schedule_overrides_log_idx on public.schedule_overrides (log_id);

alter table public.schedule_slots enable row level security;
alter table public.schedule_overrides enable row level security;

create policy "members read slots" on public.schedule_slots
  for select to authenticated using (public.is_log_member(log_id));
create policy "members write slots" on public.schedule_slots
  for all to authenticated
  using (public.is_log_member(log_id)) with check (public.is_log_member(log_id));

create policy "members read overrides" on public.schedule_overrides
  for select to authenticated using (public.is_log_member(log_id));
create policy "members write overrides" on public.schedule_overrides
  for all to authenticated
  using (public.is_log_member(log_id)) with check (public.is_log_member(log_id));

alter publication supabase_realtime add table public.schedule_slots, public.schedule_overrides;
