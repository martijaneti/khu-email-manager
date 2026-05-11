-- profiles: one row per auth.users user
create table if not exists profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null,
  display_name text,
  avatar_url   text,
  created_at   timestamptz default now()
);

-- auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- gmail_tokens: server-side only, RLS locked to owner
create table if not exists gmail_tokens (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references profiles(id) on delete cascade,
  refresh_token  text not null,
  granted_scopes text[] not null default '{}',
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

alter table gmail_tokens enable row level security;

create policy "owner only" on gmail_tokens
  for all using (auth.uid() = user_id);

-- email_summaries: cached Claude summaries per thread
create table if not exists email_summaries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  thread_id  text not null,
  summary    text not null,
  model      text not null,
  tokens_used int,
  created_at  timestamptz default now(),
  unique (user_id, thread_id)
);

alter table email_summaries enable row level security;

create policy "owner only" on email_summaries
  for all using (auth.uid() = user_id);

-- scheduled_replies: send-later queue, idempotency enforced
create table if not exists scheduled_replies (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references profiles(id) on delete cascade,
  thread_id        text not null,
  draft_body       text not null,
  send_at          timestamptz not null,
  sent_at          timestamptz,
  idempotency_key  text unique not null,
  created_at       timestamptz default now()
);

alter table scheduled_replies enable row level security;

create policy "owner only" on scheduled_replies
  for all using (auth.uid() = user_id);
