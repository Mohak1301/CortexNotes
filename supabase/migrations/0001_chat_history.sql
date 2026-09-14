-- Chat history for CortexNotes.
--
-- Ownership is enforced by Postgres, not by application code. The API forwards the
-- signed-in user's access token to PostgREST, so auth.uid() inside these policies is
-- the caller. A bug in the API cannot return another user's conversations, because
-- the database refuses to hand them over in the first place.

create table if not exists public.conversations (
  -- Random v4 uuids fragment the index on very large tables. That trade is worth
  -- taking here: these ids are handed to the browser, and a sequential bigint would
  -- let anyone enumerate rows and read off how many conversations exist.
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'New chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Lets the messages table point at (id, user_id) as a pair. See below.
  unique (id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null,

  -- Denormalised from the parent row on purpose. Checking ownership through a
  -- subquery into conversations would run that subquery for every candidate row;
  -- a plain indexed column compares in one step.
  user_id uuid not null references auth.users (id) on delete cascade,

  role text not null check (role in ('user', 'assistant')),
  content text not null,

  -- Citations are read back whole and never filtered on, so one json column beats
  -- a second table and a join.
  sources jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),

  -- The composite reference is what keeps the denormalised column honest: a message
  -- can only exist if this exact (conversation, owner) pair does. Attaching a message
  -- to someone else's conversation is rejected by the database, not by a code path
  -- somebody has to remember to write.
  foreign key (conversation_id, user_id)
    references public.conversations (id, user_id) on delete cascade
);

-- The sidebar reads one user's conversations, most recent first.
create index if not exists conversations_user_updated_idx
  on public.conversations (user_id, updated_at desc);

-- Opening a conversation reads its messages oldest first.
create index if not exists messages_conversation_created_idx
  on public.messages (conversation_id, created_at);

-- Postgres does not index foreign keys automatically, and this column is also what
-- every policy below compares against.
create index if not exists messages_user_id_idx
  on public.messages (user_id);

-- Keep the sidebar ordering correct without asking the API to remember a second
-- write. An invariant belongs next to the data it constrains.
create or replace function public.touch_conversation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.conversations
     set updated_at = now()
   where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists messages_touch_conversation on public.messages;
create trigger messages_touch_conversation
  after insert on public.messages
  for each row execute function public.touch_conversation();

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- auth.uid() is wrapped in a select so Postgres evaluates it once and caches it,
-- rather than calling it per row. Each policy is scoped to the authenticated role so
-- it is never evaluated for anonymous requests at all.
drop policy if exists conversations_owner_select on public.conversations;
create policy conversations_owner_select on public.conversations
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists conversations_owner_insert on public.conversations;
create policy conversations_owner_insert on public.conversations
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists conversations_owner_update on public.conversations;
create policy conversations_owner_update on public.conversations
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists conversations_owner_delete on public.conversations;
create policy conversations_owner_delete on public.conversations
  for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists messages_owner_select on public.messages;
create policy messages_owner_select on public.messages
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists messages_owner_insert on public.messages;
create policy messages_owner_insert on public.messages
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists messages_owner_delete on public.messages;
create policy messages_owner_delete on public.messages
  for delete to authenticated using ((select auth.uid()) = user_id);
