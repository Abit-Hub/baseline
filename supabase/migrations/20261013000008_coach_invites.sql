-- Baseline: a coach can invite players.
-- Run this AFTER 20261013000007_payments.sql.
--
-- Until now the player sent their coach a link. Now a coach has an invite link of their own.
-- A player who opens it and signs up gets a log made for them, with the coach already in it.
-- If the player already has a log, the coach is added to it.

create table public.coach_invites (
  coach_id uuid primary key references auth.users (id) on delete cascade,
  code text not null unique,
  created_at timestamptz not null default now()
);

alter table public.coach_invites enable row level security;

-- A coach can see only their own code. Everything else goes through the functions below.
create policy "see own invite" on public.coach_invites
  for select to authenticated using (coach_id = auth.uid());

-- The coach's invite code. Made the first time it is asked for.
create function public.my_coach_invite()
returns text
language plpgsql security definer set search_path = public
as $$
declare
  c text;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  select code into c from public.coach_invites where coach_id = auth.uid();
  if c is null then
    insert into public.coach_invites (coach_id, code)
    values (auth.uid(), substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))
    returning code into c;
  end if;
  return c;
end;
$$;

-- A new code. The old link stops working.
create function public.rotate_coach_invite()
returns text
language plpgsql security definer set search_path = public
as $$
declare
  fresh text := substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  insert into public.coach_invites (coach_id, code) values (auth.uid(), fresh)
  on conflict (coach_id) do update set code = excluded.code, created_at = now();
  return fresh;
end;
$$;

-- The invite page shows who is inviting. Returns the coach's name, or nothing if the link is not valid.
create function public.coach_invite_info(_code text)
returns text
language sql stable security definer set search_path = public
as $$
  select coalesce(nullif(trim(p.display_name), ''), 'A coach')
  from public.coach_invites i
  join public.profiles p on p.id = i.coach_id
  where i.code = _code;
$$;

-- The player accepts. Makes their log if they have none, then adds the coach to it.
create function public.accept_coach_invite(_code text)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  coach uuid;
  target uuid;
  nm text;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  select coach_id into coach from public.coach_invites where code = _code;
  if coach is null then raise exception 'That invite link is not valid any more'; end if;
  if coach = auth.uid() then raise exception 'This is your own invite link. Send it to a player.'; end if;

  select log_id into target from public.log_members where user_id = auth.uid() and role = 'player' limit 1;
  if target is null then
    select coalesce(nullif(trim(display_name), ''), 'My') into nm from public.profiles where id = auth.uid();
    insert into public.logs (name, created_by) values (left(nm || '’s training', 80), auth.uid()) returning id into target;
    insert into public.log_members (log_id, user_id, role) values (target, auth.uid(), 'player');
  end if;

  insert into public.log_members (log_id, user_id, role) values (target, coach, 'coach')
  on conflict (log_id, user_id) do nothing;
  return target;
end;
$$;

revoke execute on function
  public.my_coach_invite(), public.rotate_coach_invite(),
  public.coach_invite_info(text), public.accept_coach_invite(text)
  from public, anon;
grant execute on function
  public.my_coach_invite(), public.rotate_coach_invite(),
  public.coach_invite_info(text), public.accept_coach_invite(text)
  to authenticated;
