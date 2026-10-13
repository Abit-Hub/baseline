-- Baseline: a feedback box. Signed-in people can send a message.
-- Run this AFTER 20261013000004_note_seen.sql.
--
-- Nobody can read these from the app. Open them in the Supabase dashboard:
-- Table Editor, then the feedback table.

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  message text not null check (char_length(message) between 1 and 2000),
  page text not null default '',
  created_at timestamptz not null default now()
);

alter table public.feedback enable row level security;

create policy "send feedback" on public.feedback
  for insert to authenticated with check (user_id = auth.uid());
