-- ═══════════════════════════════════════════════════════
--  ORDECK I — Supabase Schema
--  Run this entire file in your Supabase SQL editor once.
--  Dashboard → SQL Editor → New query → paste → Run
-- ═══════════════════════════════════════════════════════

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ── PROFILES ──────────────────────────────────────────
create table if not exists profiles (
  id           uuid primary key references auth.users on delete cascade,
  email        text unique not null,
  name         text not null default '',
  plan         text not null default 'standard',  -- 'standard' | 'prototype-plus'
  banned       boolean not null default false,
  theme        text not null default 'cyberpunk',
  admin_unlocked boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table profiles enable row level security;
create policy "Users can read all profiles"   on profiles for select using (true);
create policy "Users can update own profile"  on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile"  on profiles for insert with check (auth.uid() = id);

-- ── PROJECTS (saved in-studio, not published) ─────────
create table if not exists projects (
  id           text primary key,
  owner        uuid not null references profiles(id) on delete cascade,
  studio       text not null,   -- 'tb' | 'vs' | 'ds'
  name         text not null default 'Untitled',
  data         jsonb not null default '{}',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table projects enable row level security;
create policy "Owner can manage own projects" on projects for all using (auth.uid() = owner);

-- ── PUBLISHED PROJECTS ────────────────────────────────
create table if not exists published_projects (
  id           text primary key,
  author       uuid not null references profiles(id) on delete cascade,
  studio       text not null,
  name         text not null,
  description  text not null default '',
  visibility   text not null default 'public',   -- 'public' | 'private'
  tags         text[] not null default '{}',
  thumb_url    text,
  license      text not null default 'all-rights',
  collabs      text[] not null default '{}',
  views        integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table published_projects enable row level security;
create policy "Public projects visible to all"  on published_projects for select using (visibility = 'public' or auth.uid() = author);
create policy "Author can manage own published"  on published_projects for all using (auth.uid() = author);
create policy "Anyone logged in can insert"      on published_projects for insert with check (auth.uid() = author);

-- ── LIKES ─────────────────────────────────────────────
create table if not exists likes (
  project_id   text not null references published_projects(id) on delete cascade,
  user_id      uuid not null references profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (project_id, user_id)
);
alter table likes enable row level security;
create policy "Likes visible to all"       on likes for select using (true);
create policy "Users manage own likes"     on likes for all using (auth.uid() = user_id);

-- ── COMMENTS ──────────────────────────────────────────
create table if not exists comments (
  id           uuid primary key default gen_random_uuid(),
  project_id   text not null references published_projects(id) on delete cascade,
  author       uuid not null references profiles(id) on delete cascade,
  text         text not null,
  created_at   timestamptz not null default now()
);
alter table comments enable row level security;
create policy "Comments visible to all"    on comments for select using (true);
create policy "Users post own comments"    on comments for insert with check (auth.uid() = author);
create policy "Users delete own comments" on comments for delete using (auth.uid() = author);

-- ── FRIENDS ───────────────────────────────────────────
create table if not exists friends (
  id           uuid primary key default gen_random_uuid(),
  user_a       uuid not null references profiles(id) on delete cascade,
  user_b       uuid not null references profiles(id) on delete cascade,
  status       text not null default 'pending',  -- 'pending' | 'accepted'
  requester    uuid not null references profiles(id),
  created_at   timestamptz not null default now(),
  unique (user_a, user_b)
);
alter table friends enable row level security;
create policy "Users see own friend rows"  on friends for select using (auth.uid() = user_a or auth.uid() = user_b);
create policy "Users manage own friend rows" on friends for all using (auth.uid() = user_a or auth.uid() = user_b);

-- ── MESSAGES ──────────────────────────────────────────
create table if not exists messages (
  id           uuid primary key default gen_random_uuid(),
  thread_id    text not null,   -- sorted([user_a, user_b]).join('__')
  sender       uuid not null references profiles(id) on delete cascade,
  receiver     uuid not null references profiles(id) on delete cascade,
  text         text not null,
  read         boolean not null default false,
  created_at   timestamptz not null default now()
);
alter table messages enable row level security;
create policy "Users see own messages"     on messages for select using (auth.uid() = sender or auth.uid() = receiver);
create policy "Users send messages"        on messages for insert with check (auth.uid() = sender);
create policy "Users update own messages"  on messages for update using (auth.uid() = receiver);

-- Enable realtime on messages table
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table friends;

-- ── BROADCAST / ADMIN CONFIG ──────────────────────────
create table if not exists admin_config (
  key    text primary key,
  value  text not null default ''
);
alter table admin_config enable row level security;
create policy "Anyone can read config"   on admin_config for select using (true);
create policy "No direct writes"         on admin_config for insert with check (false);

insert into admin_config (key, value) values
  ('broadcast', ''),
  ('motd', ''),
  ('maintenance', 'false')
on conflict (key) do nothing;

-- ── FUNCTION: increment project views ─────────────────
create or replace function increment_views(proj_id text)
returns void language sql as $$
  update published_projects set views = views + 1 where id = proj_id;
$$;

-- ═══════════════════════════════════════════════════════
-- DONE. Now copy your Project URL and anon key from
-- Supabase Dashboard → Settings → API
-- and paste them into js/supabase.js
-- ═══════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════
--  GROUP WORK SYSTEM TABLES
-- ═══════════════════════════════════════════════════════
create extension if not exists "pgcrypto";
create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  name text not null, description text not null default '',
  studio text not null default 'all', avatar_color text not null default '#8b5cf6',
  owner uuid not null references profiles(id) on delete cascade,
  visibility text not null default 'private', invite_code text unique,
  created_at timestamptz not null default now()
);
alter table groups enable row level security;
create policy "members see group" on groups for select using (
  visibility='public' or auth.uid()=owner or
  exists(select 1 from group_members m where m.group_id=id and m.user_id=auth.uid() and m.status='active')
);
create policy "owner manage group" on groups for all using (auth.uid()=owner);
create policy "insert group" on groups for insert with check (auth.uid()=owner);

create table if not exists group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null default 'member', status text not null default 'active',
  joined_at timestamptz not null default now(), unique(group_id,user_id)
);
alter table group_members enable row level security;
create policy "see group members" on group_members for select using (
  exists(select 1 from group_members m2 where m2.group_id=group_id and m2.user_id=auth.uid())
);
create policy "manage own membership" on group_members for all using (auth.uid()=user_id);
create policy "admin manage" on group_members for all using (
  exists(select 1 from group_members m3 where m3.group_id=group_id and m3.user_id=auth.uid() and m3.role in('owner','admin'))
);
create policy "join group" on group_members for insert with check (auth.uid()=user_id);

create table if not exists group_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  sender uuid not null references profiles(id) on delete cascade,
  text text not null, msg_type text not null default 'text', meta jsonb,
  created_at timestamptz not null default now()
);
alter table group_messages enable row level security;
create policy "members see chat" on group_messages for select using (
  exists(select 1 from group_members m where m.group_id=group_id and m.user_id=auth.uid() and m.status='active')
);
create policy "members send" on group_messages for insert with check (
  auth.uid()=sender and exists(select 1 from group_members m where m.group_id=group_id and m.user_id=auth.uid() and m.status='active')
);

create table if not exists group_projects (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  project_id text not null, added_by uuid not null references profiles(id),
  pinned boolean not null default false, added_at timestamptz not null default now()
);
alter table group_projects enable row level security;
create policy "members see group projects" on group_projects for select using (
  exists(select 1 from group_members m where m.group_id=group_id and m.user_id=auth.uid() and m.status='active')
);
create policy "members add projects" on group_projects for insert with check (
  auth.uid()=added_by and exists(select 1 from group_members m where m.group_id=group_id and m.user_id=auth.uid() and m.status='active')
);
create policy "admins remove" on group_projects for delete using (
  exists(select 1 from group_members m where m.group_id=group_id and m.user_id=auth.uid() and m.role in('owner','admin'))
);

create table if not exists group_tasks (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  title text not null, description text not null default '',
  assigned_to uuid references profiles(id), status text not null default 'todo',
  priority text not null default 'medium', due_date date,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table group_tasks enable row level security;
create policy "members see tasks" on group_tasks for select using (
  exists(select 1 from group_members m where m.group_id=group_id and m.user_id=auth.uid() and m.status='active')
);
create policy "members manage tasks" on group_tasks for all using (
  exists(select 1 from group_members m where m.group_id=group_id and m.user_id=auth.uid() and m.status='active')
);

alter publication supabase_realtime add table group_messages;
alter publication supabase_realtime add table group_members;
alter publication supabase_realtime add table group_tasks;
