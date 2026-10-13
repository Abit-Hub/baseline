-- Baseline: players can mark a coach's note as seen ("Got it").
-- Run this AFTER 20261013000003_schedule.sql.

alter table public.coach_notes add column acknowledged_at timestamptz;

-- Notes written before this existed count as seen, so nobody gets a pile of old "not seen" flags.
update public.coach_notes set acknowledged_at = created_at where acknowledged_at is null;

-- Nobody edits acknowledged_at directly. Only the function below sets it.
revoke update on public.coach_notes from authenticated;
grant update (note) on public.coach_notes to authenticated;

create function public.acknowledge_note(_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  target uuid;
begin
  select log_id into target from public.coach_notes where id = _id;
  if target is null or not public.is_log_player(target) then
    raise exception 'Only the player can mark a note as seen';
  end if;
  update public.coach_notes set acknowledged_at = now() where id = _id and acknowledged_at is null;
end;
$$;

revoke execute on function public.acknowledge_note(uuid) from public, anon;
grant execute on function public.acknowledge_note(uuid) to authenticated;

-- The coach dashboard also needs to know how many notes are still unseen.
drop function public.my_players();

create function public.my_players()
returns table (
  log_id uuid,
  log_name text,
  player_id uuid,
  player_name text,
  session_count integer,
  last_session date,
  avg_recent numeric,
  last_note timestamptz,
  unseen_notes integer
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
    (select max(n.created_at) from public.coach_notes n where n.log_id = l.id),
    (select count(*)::int from public.coach_notes n where n.log_id = l.id and n.acknowledged_at is null)
  from public.logs l
  join public.log_members cm on cm.log_id = l.id and cm.user_id = auth.uid() and cm.role = 'coach'
  join public.log_members pm on pm.log_id = l.id and pm.role = 'player'
  join public.profiles p on p.id = pm.user_id
  order by p.display_name;
$$;

revoke execute on function public.my_players() from public, anon;
grant execute on function public.my_players() to authenticated;
