-- Baseline: real player and coach roles.
-- Run this AFTER 20261013000000_init.sql.
--
-- Model: every log belongs to one player. A coach can be invited into any
-- number of players' logs. The player owns their own entries. The coach can
-- read everything, write coach notes, and suggest drills and goals.

-- ----------------------------------------------------- one player per log
-- Anyone who created a log in the first version becomes its player,
-- everybody else in it becomes a coach.
update public.log_members m
set role = case when l.created_by = m.user_id then 'player' else 'coach' end
from public.logs l
where l.id = m.log_id;

create unique index log_members_one_player on public.log_members (log_id) where role = 'player';

-- --------------------------------------------------------- coach notes
alter table public.sessions add constraint sessions_id_log_unique unique (id, log_id);

create table public.coach_notes (
  id uuid primary key default gen_random_uuid(),
  log_id uuid not null references public.logs (id) on delete cascade,
  session_id uuid,
  note text not null check (char_length(note) between 1 and 2000),
  author_id uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  -- a note can only point at a session in the same log
  foreign key (session_id, log_id) references public.sessions (id, log_id) on delete cascade
);
create index coach_notes_log_idx on public.coach_notes (log_id, created_at desc);

-- Keep anything already written in the old per-session coach note field.
insert into public.coach_notes (log_id, session_id, note, author_id, created_at)
select log_id, id, coach_note, null, created_at from public.sessions where coach_note <> '';
alter table public.sessions drop column coach_note;

-- ------------------------------------------- who added drills and goals
alter table public.drills add column created_by uuid references auth.users (id) on delete set null default auth.uid();
alter table public.goals add column created_by uuid references auth.users (id) on delete set null default auth.uid();

-- ------------------------------------------------------ role helpers
create function public.is_log_player(_log uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.log_members
    where log_id = _log and user_id = auth.uid() and role = 'player'
  );
$$;

create function public.is_log_coach(_log uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.log_members
    where log_id = _log and user_id = auth.uid() and role = 'coach'
  );
$$;

-- ----------------------------------------------------------- policies
drop policy "members use sessions" on public.sessions;
drop policy "members use drills" on public.drills;
drop policy "members use club items" on public.club_items;
drop policy "members use goals" on public.goals;
drop policy "members update their logs" on public.logs;
drop policy "leave a log" on public.log_members;

alter table public.coach_notes enable row level security;

-- Everyone in a log can read it.
create policy "members read sessions" on public.sessions
  for select to authenticated using (public.is_log_member(log_id));
create policy "members read drills" on public.drills
  for select to authenticated using (public.is_log_member(log_id));
create policy "members read club items" on public.club_items
  for select to authenticated using (public.is_log_member(log_id));
create policy "members read goals" on public.goals
  for select to authenticated using (public.is_log_member(log_id));
create policy "members read coach notes" on public.coach_notes
  for select to authenticated using (public.is_log_member(log_id));

-- The player owns their entries.
create policy "player writes sessions" on public.sessions
  for all to authenticated
  using (public.is_log_player(log_id)) with check (public.is_log_player(log_id));
create policy "player writes drills" on public.drills
  for all to authenticated
  using (public.is_log_player(log_id)) with check (public.is_log_player(log_id));
create policy "player writes club items" on public.club_items
  for all to authenticated
  using (public.is_log_player(log_id)) with check (public.is_log_player(log_id));
create policy "player writes goals" on public.goals
  for all to authenticated
  using (public.is_log_player(log_id)) with check (public.is_log_player(log_id));
create policy "player updates their log" on public.logs
  for update to authenticated
  using (public.is_log_player(id)) with check (public.is_log_player(id));

-- A coach can add drills and goals, and change or remove only their own.
create policy "coach adds drills" on public.drills
  for insert to authenticated
  with check (public.is_log_coach(log_id) and created_by = auth.uid());
create policy "coach edits own drills" on public.drills
  for update to authenticated
  using (public.is_log_coach(log_id) and created_by = auth.uid())
  with check (public.is_log_coach(log_id) and created_by = auth.uid());
create policy "coach removes own drills" on public.drills
  for delete to authenticated
  using (public.is_log_coach(log_id) and created_by = auth.uid());

create policy "coach adds goals" on public.goals
  for insert to authenticated
  with check (public.is_log_coach(log_id) and created_by = auth.uid());
create policy "coach edits own goals" on public.goals
  for update to authenticated
  using (public.is_log_coach(log_id) and created_by = auth.uid())
  with check (public.is_log_coach(log_id) and created_by = auth.uid());
create policy "coach removes own goals" on public.goals
  for delete to authenticated
  using (public.is_log_coach(log_id) and created_by = auth.uid());

-- Coach notes belong to the coach who wrote them. The player only reads.
create policy "coach writes notes" on public.coach_notes
  for insert to authenticated
  with check (public.is_log_coach(log_id) and author_id = auth.uid());
create policy "coach edits own notes" on public.coach_notes
  for update to authenticated
  using (public.is_log_coach(log_id) and author_id = auth.uid())
  with check (public.is_log_coach(log_id) and author_id = auth.uid());
create policy "coach removes own notes" on public.coach_notes
  for delete to authenticated
  using (public.is_log_coach(log_id) and author_id = auth.uid());

-- A coach can leave. The player can remove a coach. The player cannot be removed.
create policy "leave or remove a coach" on public.log_members
  for delete to authenticated
  using (role = 'coach' and (user_id = auth.uid() or public.is_log_player(log_id)));

-- --------------------------------------------------------------- RPCs
drop function public.create_log(text, text);
drop function public.join_log(text, text);

create function public.create_log(_name text)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  new_id uuid;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  if exists (select 1 from public.log_members where user_id = auth.uid() and role = 'player') then
    raise exception 'You already have a log';
  end if;
  insert into public.logs (name, created_by) values (_name, auth.uid()) returning id into new_id;
  insert into public.log_members (log_id, user_id, role) values (new_id, auth.uid(), 'player');
  return new_id;
end;
$$;

-- An invite link always adds a coach. The player is whoever created the log.
create function public.join_log(_code text)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  target uuid;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  select id into target from public.logs where invite_code = _code;
  if target is null then raise exception 'That invite link is not valid any more'; end if;
  insert into public.log_members (log_id, user_id, role)
  values (target, auth.uid(), 'coach')
  on conflict (log_id, user_id) do nothing;
  return target;
end;
$$;

create or replace function public.rotate_invite_code(_log uuid)
returns text
language plpgsql security definer set search_path = public
as $$
declare
  fresh text := substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);
begin
  if not public.is_log_player(_log) then raise exception 'Only the player can change the invite link'; end if;
  update public.logs set invite_code = fresh where id = _log;
  return fresh;
end;
$$;

-- One row per player this person coaches, for the coach dashboard.
create function public.my_players()
returns table (
  log_id uuid,
  log_name text,
  player_id uuid,
  player_name text,
  session_count integer,
  last_session date,
  avg_recent numeric,
  last_note timestamptz
)
language sql stable security definer set search_path = public
as $$
  select
    l.id,
    l.name,
    p.id,
    p.display_name,
    (select count(*)::int from public.sessions s where s.log_id = l.id),
    (select max(s.session_date) from public.sessions s where s.log_id = l.id),
    (select round(avg(r.rating)::numeric, 1) from (
        select s.rating from public.sessions s
        where s.log_id = l.id and s.rating is not null
        order by s.session_date desc, s.created_at desc limit 5) r),
    (select max(n.created_at) from public.coach_notes n where n.log_id = l.id)
  from public.logs l
  join public.log_members cm on cm.log_id = l.id and cm.user_id = auth.uid() and cm.role = 'coach'
  join public.log_members pm on pm.log_id = l.id and pm.role = 'player'
  join public.profiles p on p.id = pm.user_id
  order by p.display_name;
$$;

revoke execute on function
  public.is_log_player(uuid), public.is_log_coach(uuid),
  public.create_log(text), public.join_log(text), public.my_players()
  from public, anon;
grant execute on function
  public.is_log_player(uuid), public.is_log_coach(uuid),
  public.create_log(text), public.join_log(text), public.my_players()
  to authenticated;

-- ------------------------------------------------------------ realtime
alter publication supabase_realtime add table public.coach_notes;
