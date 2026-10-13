-- Baseline: a shared training log for a player and their coach.
-- Run this once in the Supabase SQL editor (or with `supabase db push`).

-- ---------------------------------------------------------------- tables
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 80),
  created_at timestamptz not null default now()
);

create table public.logs (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  invite_code text not null unique default substr(replace(gen_random_uuid()::text, '-', ''), 1, 12),
  club_status text not null default 'learning'
    check (club_status in ('learning', 'visit', 'visited', 'applied', 'member')),
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

create table public.log_members (
  log_id uuid not null references public.logs (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('player', 'coach')),
  joined_at timestamptz not null default now(),
  primary key (log_id, user_id)
);
create index log_members_user_idx on public.log_members (user_id);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  log_id uuid not null references public.logs (id) on delete cascade,
  session_date date not null,
  focus text[] not null default '{}',
  rating smallint check (rating between 1 and 5),
  worked text not null default '' check (char_length(worked) <= 2000),
  well text not null default '' check (char_length(well) <= 2000),
  fix text not null default '' check (char_length(fix) <= 2000),
  coach_note text not null default '' check (char_length(coach_note) <= 2000),
  created_by uuid references auth.users (id) default auth.uid(),
  created_at timestamptz not null default now()
);
create index sessions_log_date_idx on public.sessions (log_id, session_date desc);

create table public.drills (
  id uuid primary key default gen_random_uuid(),
  log_id uuid not null references public.logs (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  skill text not null default 'Other',
  description text not null default '' check (char_length(description) <= 300),
  times integer not null default 0 check (times >= 0),
  last_practised date,
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create index drills_log_idx on public.drills (log_id);

create table public.club_items (
  id uuid primary key default gen_random_uuid(),
  log_id uuid not null references public.logs (id) on delete cascade,
  text text not null check (char_length(text) between 1 and 200),
  done boolean not null default false,
  answer text not null default '' check (char_length(answer) <= 500),
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create index club_items_log_idx on public.club_items (log_id);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  log_id uuid not null references public.logs (id) on delete cascade,
  text text not null check (char_length(text) between 1 and 160),
  target_date date,
  done boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create index goals_log_idx on public.goals (log_id);

-- ------------------------------------------------------ helper functions
create function public.is_log_member(_log uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.log_members where log_id = _log and user_id = auth.uid()
  );
$$;

create function public.shares_log_with(_user uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.log_members a
    join public.log_members b on a.log_id = b.log_id
    where a.user_id = auth.uid() and b.user_id = _user
  );
$$;

-- Create the profile row when someone signs up.
create function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'display_name', ''), 80));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------- RPCs
-- Members are only ever added through these functions, so nobody can
-- put themselves into a log they were not invited to.
create function public.create_log(_name text, _role text)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  new_id uuid;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  insert into public.logs (name, created_by) values (_name, auth.uid()) returning id into new_id;
  insert into public.log_members (log_id, user_id, role) values (new_id, auth.uid(), _role);
  return new_id;
end;
$$;

create function public.join_log(_code text, _role text)
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
  values (target, auth.uid(), _role)
  on conflict (log_id, user_id) do nothing;
  return target;
end;
$$;

create function public.rotate_invite_code(_log uuid)
returns text
language plpgsql security definer set search_path = public
as $$
declare
  fresh text := substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);
begin
  if not public.is_log_member(_log) then raise exception 'Not a member of this log'; end if;
  update public.logs set invite_code = fresh where id = _log;
  return fresh;
end;
$$;

revoke execute on all functions in schema public from public, anon;
grant execute on function
  public.is_log_member(uuid), public.shares_log_with(uuid),
  public.create_log(text, text), public.join_log(text, text), public.rotate_invite_code(uuid)
  to authenticated;

-- ------------------------------------------------------------------ RLS
alter table public.profiles enable row level security;
alter table public.logs enable row level security;
alter table public.log_members enable row level security;
alter table public.sessions enable row level security;
alter table public.drills enable row level security;
alter table public.club_items enable row level security;
alter table public.goals enable row level security;

create policy "see yourself and people you share a log with" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.shares_log_with(id));
create policy "edit your own profile" on public.profiles
  for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy "members read their logs" on public.logs
  for select to authenticated using (public.is_log_member(id));
create policy "members update their logs" on public.logs
  for update to authenticated
  using (public.is_log_member(id)) with check (public.is_log_member(id));
-- Only the name and club status can be changed directly.
revoke update on public.logs from authenticated;
grant update (name, club_status) on public.logs to authenticated;

create policy "members see who is in their logs" on public.log_members
  for select to authenticated using (public.is_log_member(log_id));
create policy "leave a log" on public.log_members
  for delete to authenticated using (user_id = auth.uid());

create policy "members use sessions" on public.sessions
  for all to authenticated
  using (public.is_log_member(log_id)) with check (public.is_log_member(log_id));
create policy "members use drills" on public.drills
  for all to authenticated
  using (public.is_log_member(log_id)) with check (public.is_log_member(log_id));
create policy "members use club items" on public.club_items
  for all to authenticated
  using (public.is_log_member(log_id)) with check (public.is_log_member(log_id));
create policy "members use goals" on public.goals
  for all to authenticated
  using (public.is_log_member(log_id)) with check (public.is_log_member(log_id));

-- ------------------------------------------------------------- realtime
alter publication supabase_realtime add table
  public.sessions, public.drills, public.club_items, public.goals, public.logs, public.log_members;
