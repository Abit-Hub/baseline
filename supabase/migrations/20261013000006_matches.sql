-- Baseline: a match log. The player records matches; the coach can read them.
-- Run this AFTER 20261013000005_feedback.sql.

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  log_id uuid not null references public.logs (id) on delete cascade,
  match_date date not null default current_date,
  opponent text not null default '' check (char_length(opponent) <= 80),
  result text not null check (result in ('win', 'loss')),
  score text not null default '' check (char_length(score) <= 60),
  worked text not null default '' check (char_length(worked) <= 2000),
  fix text not null default '' check (char_length(fix) <= 2000),
  created_at timestamptz not null default now()
);
create index matches_log_idx on public.matches (log_id, match_date desc);

alter table public.matches enable row level security;

create policy "members read matches" on public.matches
  for select to authenticated using (public.is_log_member(log_id));
create policy "player writes matches" on public.matches
  for all to authenticated
  using (public.is_log_player(log_id)) with check (public.is_log_player(log_id));

alter publication supabase_realtime add table public.matches;
