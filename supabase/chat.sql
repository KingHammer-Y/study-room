-- Add-on migration for the private room chat. Apply after schema.sql.
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null,
  user_id uuid not null,
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now(),
  constraint chat_messages_member_fk foreign key (room_id, user_id)
    references public.room_members(room_id, user_id) on delete cascade
);

create index if not exists chat_messages_room_created_idx
  on public.chat_messages(room_id, created_at desc);

alter table public.chat_messages enable row level security;
revoke all on public.chat_messages from anon, authenticated;
grant select on public.chat_messages to authenticated;
grant insert(room_id, user_id, body) on public.chat_messages to authenticated;

drop policy if exists "room members can read chat" on public.chat_messages;
create policy "room members can read chat" on public.chat_messages
  for select to authenticated
  using (public.is_room_member(room_id));

drop policy if exists "members can send as themselves" on public.chat_messages;
create policy "members can send as themselves" on public.chat_messages
  for insert to authenticated
  with check (user_id = (select auth.uid()) and public.is_room_member(room_id));

do $$ begin
  alter publication supabase_realtime add table public.chat_messages;
exception when duplicate_object then null;
end $$;
