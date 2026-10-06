-- Safely assign the existing room to its creator and allow only that owner to rename it.
-- This migration does not delete or recreate any room/member/session rows.

alter table public.rooms
  add column if not exists created_by uuid references auth.users(id) on delete restrict;

-- Backfill only when the room has no owner; never silently overwrite another owner.
update public.rooms
set created_by = '65c3705b-007a-4369-86e2-c901eb5d4dc8'::uuid
where id = '9e40336c-5cee-4084-b771-b66a7d8cecce'::uuid
  and created_by is null;

do $$
begin
  if not exists (
    select 1 from public.rooms
    where id = '9e40336c-5cee-4084-b771-b66a7d8cecce'::uuid
      and created_by = '65c3705b-007a-4369-86e2-c901eb5d4dc8'::uuid
  ) then
    raise exception 'Room not found, Auth user does not exist, or this room is already assigned to another owner. No ownership was overwritten.';
  end if;
end $$;

-- Users may read rooms as before, but can update only the name column.
revoke update on public.rooms from anon, authenticated;
grant update (name) on public.rooms to authenticated;

drop policy if exists "room creators can rename their room" on public.rooms;
create policy "room creators can rename their room"
  on public.rooms
  for update
  to authenticated
  using (created_by = (select auth.uid()))
  with check (created_by = (select auth.uid()));
