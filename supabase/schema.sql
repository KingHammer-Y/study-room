-- Run in the Supabase SQL editor after creating the three accounts in Auth.
-- Replace the UUIDs in the final INSERT with those three Auth user IDs.
create extension if not exists pgcrypto;

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id) on delete restrict,
  name text not null default '周末自习室',
  created_at timestamptz not null default now()
);

create table if not exists public.room_members (
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  animal text not null check (animal in ('🐻','🐱','🐰','🦊','🐼','🐸','🦦','🦔')),
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create table if not exists public.work_sessions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null,
  user_id uuid not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  constraint work_sessions_member_fk foreign key (room_id, user_id)
    references public.room_members(room_id, user_id) on delete cascade,
  constraint work_sessions_end_after_start check (ended_at is null or ended_at >= started_at)
);

create index if not exists work_sessions_room_user_started_idx
  on public.work_sessions(room_id, user_id, started_at desc);
create unique index if not exists one_open_session_per_member
  on public.work_sessions(room_id, user_id) where ended_at is null;

alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.work_sessions enable row level security;

revoke all on public.rooms, public.room_members, public.work_sessions from anon, authenticated;
grant select on public.rooms, public.room_members, public.work_sessions to authenticated;
grant update (name) on public.rooms to authenticated;
grant update(display_name, animal) on public.room_members to authenticated;
grant insert(room_id, user_id, started_at) on public.work_sessions to authenticated;
grant update(ended_at) on public.work_sessions to authenticated;

create or replace function public.is_room_member(_room_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.room_members m where m.room_id = _room_id and m.user_id = (select auth.uid())) $$;
revoke all on function public.is_room_member(uuid) from public, anon;
grant execute on function public.is_room_member(uuid) to authenticated;

create policy "room members can read their room" on public.rooms
  for select to authenticated
  using (public.is_room_member(id));
create policy "room creators can rename their room" on public.rooms
  for update to authenticated
  using (created_by = (select auth.uid()))
  with check (created_by = (select auth.uid()));

create policy "members can read room roster" on public.room_members
  for select to authenticated
  using (public.is_room_member(room_id));
create policy "members can update their own profile" on public.room_members
  for update to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "members can read room work sessions" on public.work_sessions
  for select to authenticated
  using (public.is_room_member(room_id));
create policy "members can start their own sessions" on public.work_sessions
  for insert to authenticated
  with check (user_id = (select auth.uid()) and public.is_room_member(room_id));
create policy "members can end their own sessions" on public.work_sessions
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

do $$ begin
  alter publication supabase_realtime add table public.work_sessions;
exception when duplicate_object then null;
end $$;

-- Bootstrap one private room and its three fixed members (run after Auth accounts exist).
insert into public.rooms(name, created_by)
values ('周末自习室', '65c3705b-007a-4369-86e2-c901eb5d4dc8') returning id;
-- Then run, substituting the room UUID above and the three auth.users UUIDs:
-- insert into public.room_members(room_id,user_id,display_name,animal) values
-- ('ROOM_UUID','USER_1_UUID','小熊','🐻'),
-- ('ROOM_UUID','USER_2_UUID','阿梨','🐱'),
-- ('ROOM_UUID','USER_3_UUID','松果','🐰');
