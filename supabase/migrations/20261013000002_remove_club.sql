-- Baseline: the club checklist and club status are no longer part of the app.
-- Run this AFTER 20261013000001_roles.sql.

alter publication supabase_realtime drop table public.club_items;
drop table public.club_items;

revoke update (club_status) on public.logs from authenticated;
alter table public.logs drop column club_status;
