-- Baseline: what a coach and player agreed, and what has been paid.
-- Run this AFTER 20261013000006_matches.sql.
--
-- An arrangement is either a bundle ("12 sessions for 30,000") or a rate per session.
-- A log has one current arrangement; older ones stay as history. Payments are kept
-- per player in one running list. Amounts are whole naira.
--
-- Who can do what:
--   coach  sets the arrangement, records payments, confirms what a player says they paid.
--   player reads everything, and can say "I've paid" (a pending payment the coach confirms).

create table public.arrangements (
  id uuid primary key default gen_random_uuid(),
  log_id uuid not null references public.logs (id) on delete cascade,
  kind text not null check (kind in ('package', 'per_session')),
  sessions integer check (sessions is null or sessions > 0),
  price integer not null check (price >= 0),
  start_date date not null default current_date,
  -- The day the next arrangement took over (exclusive). Null = current.
  ended_on date,
  created_at timestamptz not null default now(),
  check ((kind = 'package') = (sessions is not null)),
  check (ended_on is null or ended_on >= start_date)
);
create index arrangements_log_idx on public.arrangements (log_id, start_date desc);
create unique index arrangements_one_current on public.arrangements (log_id) where ended_on is null;

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  log_id uuid not null references public.logs (id) on delete cascade,
  amount integer not null check (amount > 0),
  paid_on date not null default current_date,
  -- True when the player said they paid and the coach has not confirmed it yet.
  pending boolean not null default false,
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index payments_log_idx on public.payments (log_id, paid_on desc);

alter table public.arrangements enable row level security;
alter table public.payments enable row level security;

create policy "members read arrangements" on public.arrangements
  for select to authenticated using (public.is_log_member(log_id));
create policy "coach edits arrangements" on public.arrangements
  for update to authenticated
  using (public.is_log_coach(log_id)) with check (public.is_log_coach(log_id));
create policy "coach removes arrangements" on public.arrangements
  for delete to authenticated using (public.is_log_coach(log_id));
-- New arrangements are only made through start_arrangement() below.

create policy "members read payments" on public.payments
  for select to authenticated using (public.is_log_member(log_id));
create policy "coach records payments" on public.payments
  for insert to authenticated
  with check (public.is_log_coach(log_id) and created_by = auth.uid());
create policy "player says they paid" on public.payments
  for insert to authenticated
  with check (public.is_log_player(log_id) and pending and created_by = auth.uid());
create policy "coach confirms payments" on public.payments
  for update to authenticated
  using (public.is_log_coach(log_id)) with check (public.is_log_coach(log_id));
create policy "coach removes payments" on public.payments
  for delete to authenticated using (public.is_log_coach(log_id));
create policy "player removes their own pending payment" on public.payments
  for delete to authenticated
  using (public.is_log_player(log_id) and pending and created_by = auth.uid());

-- Starts a new arrangement. The one that was current ends on the new start date, so
-- each session is counted once. A current arrangement that starts on or after the new
-- date is replaced instead, which is how a mistake made today gets corrected.
create function public.start_arrangement(_log uuid, _kind text, _sessions integer, _price integer, _start date)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  new_id uuid;
begin
  if not public.is_log_coach(_log) then raise exception 'Only the coach can set up payments'; end if;
  delete from public.arrangements where log_id = _log and ended_on is null and start_date >= _start;
  update public.arrangements set ended_on = _start where log_id = _log and ended_on is null;
  insert into public.arrangements (log_id, kind, sessions, price, start_date)
  values (_log, _kind, _sessions, _price, _start) returning id into new_id;
  return new_id;
end;
$$;

revoke execute on function public.start_arrangement(uuid, text, integer, integer, date) from public, anon;
grant execute on function public.start_arrangement(uuid, text, integer, integer, date) to authenticated;

alter publication supabase_realtime add table public.arrangements, public.payments;
