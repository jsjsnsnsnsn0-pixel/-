create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  recipient_public_id bigint not null,
  sender_public_id bigint,
  sender_display_name text,
  sender_avatar_url text,
  recipient_display_name text,
  recipient_avatar_url text,
  message_type text not null default 'text' check (message_type in ('text','voice','gift')),
  content text,
  media_url text,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  check (sender_id <> recipient_id),
  check (
    (message_type = 'text' and content is not null and length(btrim(content)) between 1 and 4000)
    or (message_type in ('voice','gift') and (media_url is not null or content is not null))
  )
);

create index if not exists direct_messages_sender_created_idx on public.direct_messages(sender_id, created_at desc);
create index if not exists direct_messages_recipient_created_idx on public.direct_messages(recipient_id, created_at desc);
create index if not exists direct_messages_pair_idx on public.direct_messages(sender_id, recipient_id, created_at desc);

alter table public.direct_messages enable row level security;

create or replace function public.prepare_direct_message()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_sender uuid := (select auth.uid());
begin
  if v_sender is null then
    raise exception 'authentication required';
  end if;

  new.sender_id := v_sender;
  new.content := nullif(btrim(coalesce(new.content,'')), '');

  select p.id, p.public_id, p.display_name, p.avatar_url
    into new.recipient_id, new.recipient_public_id, new.recipient_display_name, new.recipient_avatar_url
  from public.profiles p
  where p.public_id = new.recipient_public_id;

  if new.recipient_id is null then
    raise exception 'recipient not found';
  end if;
  if new.recipient_id = v_sender then
    raise exception 'cannot message yourself';
  end if;

  select p.public_id, p.display_name, p.avatar_url
    into new.sender_public_id, new.sender_display_name, new.sender_avatar_url
  from public.profiles p
  where p.id = v_sender;

  return new;
end;
$$;

revoke execute on function public.prepare_direct_message() from public, anon, authenticated;

drop trigger if exists direct_messages_prepare on public.direct_messages;
create trigger direct_messages_prepare
before insert on public.direct_messages
for each row execute function public.prepare_direct_message();

drop policy if exists direct_messages_select_participants on public.direct_messages;
drop policy if exists direct_messages_insert_sender on public.direct_messages;
drop policy if exists direct_messages_update_recipient on public.direct_messages;

create policy direct_messages_select_participants
on public.direct_messages for select to authenticated
using (
  sender_id = (select auth.uid())
  or recipient_id = (select auth.uid())
);

create policy direct_messages_insert_sender
on public.direct_messages for insert to authenticated
with check (
  sender_id = (select auth.uid())
  and recipient_id <> (select auth.uid())
);

create policy direct_messages_update_recipient
on public.direct_messages for update to authenticated
using (recipient_id = (select auth.uid()))
with check (
  recipient_id = (select auth.uid())
  and sender_id <> (select auth.uid())
);

revoke all on public.direct_messages from anon;
revoke all on public.direct_messages from authenticated;
grant select on public.direct_messages to authenticated;
grant insert (recipient_public_id, message_type, content, media_url) on public.direct_messages to authenticated;
grant update (read_at) on public.direct_messages to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='direct_messages'
  ) then
    alter publication supabase_realtime add table public.direct_messages;
  end if;
end $$;
