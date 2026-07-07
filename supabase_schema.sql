-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Reset Schema (CAUTION: This will DROP EXISTING DATA)
drop table if exists public.join_codes cascade;
drop table if exists public.organization_members cascade;
drop table if exists public.organizations cascade;
drop table if exists public.scopes cascade;
drop table if exists public.activities cascade;
drop table if exists public.columns cascade;
drop table if exists public.tasks cascade;

-- 1. Organizations (Must be created first as it is a foreign key for others)
create table public.organizations (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  owner_id uuid references auth.users(id) not null,
  created_at timestamptz default now()
);

-- 2. Organization Members (Depend on Organizations)
create table public.organization_members (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references public.organizations(id) not null,
  user_id uuid references auth.users(id) not null,
  role text default 'member',
  created_at timestamptz default now(),
  unique(organization_id, user_id)
);

-- 3. Tasks Table
create table public.tasks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) not null,
  title text not null,
  description text,
  status text not null, -- Links to columns.id
  deadline timestamptz,
  created_at timestamptz default now(),
  scope text,
  organization_id uuid references public.organizations(id), -- Null for personal tasks
  assignee_id uuid references auth.users(id) -- NEW: Assignee field
);

-- 4. Columns Table (to persist custom columns)
create table public.columns (
  id text not null, -- We use text IDs like 'TODO', 'IN_PROGRESS'
  user_id uuid references auth.users(id) not null,
  title text not null,
  position integer default 0, -- To maintain order
  organization_id uuid references public.organizations(id),
  primary key (id, user_id, organization_id)
);

-- 5. Activity Logs Table
create table public.activities (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) not null,
  action text not null,
  task_title text,
  type text check (type in ('success', 'danger', 'neutral')),
  organization_id uuid references public.organizations(id),
  created_at timestamptz default now()
);

-- 6. Scopes Table
create table public.scopes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) not null,
  title text not null,
  organization_id uuid references public.organizations(id),
  created_at timestamptz default now()
);

-- 7. Join Codes
-- 7. Join Codes
create table public.join_codes (
  code text primary key,
  organization_id uuid references public.organizations(id) not null,
  max_uses int not null default 1,
  used_count int not null default 0,
  created_at timestamptz default now(),
  expires_at timestamptz
);

-- 8. Profiles (Public user info)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text,
  updated_at timestamptz default now()
);

-- Update Activities Table
alter table public.activities add column if not exists username text;

-- Enable Row Level Security (RLS)
alter table public.tasks enable row level security;
alter table public.columns enable row level security;
alter table public.activities enable row level security;
alter table public.scopes enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.join_codes enable row level security;
alter table public.profiles enable row level security;

-- Helper Function to prevent RLS recursion
create or replace function get_my_org_ids()
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  select organization_id from public.organization_members where user_id = auth.uid();
$$;

-- RLS Policies for ORGANIZATIONS
create policy "Users can view organizations they belong to"
  on public.organizations for select
  using (
    auth.uid() = owner_id 
    or 
    id in (select get_my_org_ids())
  );

create policy "Users can create organizations"
  on public.organizations for insert
  with check (auth.uid() = owner_id);

-- RLS Policies for ORGANIZATION MEMBERS
create policy "Users can view members of their orgs"
  on public.organization_members for select
  using (
    user_id = auth.uid()
    or
    organization_id in (select get_my_org_ids())
  );

create policy "Owners can manage members"
  on public.organization_members for all
  using (
     exists (select 1 from public.organizations where id = organization_id and owner_id = auth.uid())
  );

create policy "Members can leave organizations"
  on public.organization_members for delete
  using (
    auth.uid() = user_id
  );

-- Backfill missing leaders (Self-correction for previous missing policy)
insert into public.organization_members (organization_id, user_id, role)
select id, owner_id, 'leader'
from public.organizations
where not exists (
  select 1 from public.organization_members 
  where organization_id = public.organizations.id 
  and user_id = public.organizations.owner_id
);

-- ( ... RLS policies for Scopes, Tasks, Columns, Activities, Join Codes, Profiles ... ) 

-- Realtime: Enable listening to changes
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime for table 
    public.tasks, 
    public.columns, 
    public.organizations, 
    public.organization_members,
    public.activities,
    public.scopes,
    public.profiles;
commit;

-- RPC: Join Team via Code
create or replace function join_team_via_code(code_input text)
returns json
language plpgsql
security definer
as $$
declare
  v_org_id uuid;
  v_max_uses int;
  v_used_count int;
  v_expires_at timestamptz;
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  
  -- 1. Check Code
  select organization_id, max_uses, used_count, expires_at
  into v_org_id, v_max_uses, v_used_count, v_expires_at
  from public.join_codes
  where code = code_input;
  
  if v_org_id is null then
    return json_build_object('success', false, 'message', 'Invalid code');
  end if;
  
  if v_used_count >= v_max_uses then
    return json_build_object('success', false, 'message', 'Code fully used');
  end if;
  
  if v_expires_at is not null and v_expires_at < now() then
     return json_build_object('success', false, 'message', 'Code expired');
  end if;
  
  -- 2. Check if already member
  if exists (select 1 from public.organization_members where organization_id = v_org_id and user_id = v_user_id) then
    return json_build_object('success', false, 'message', 'Already a member');
  end if;
  
  -- 3. Add Member
  insert into public.organization_members (organization_id, user_id, role)
  values (v_org_id, v_user_id, 'member');
  
  -- 4. Increment Count
  update public.join_codes
  set used_count = used_count + 1
  where code = code_input;
  
  return json_build_object('success', true, 'org_id', v_org_id);
end;
  return json_build_object('success', true, 'org_id', v_org_id);
end;
$$;

-- MIGRATION: Add Assignee Column (Run this if you have an existing DB)
-- alter table public.tasks add column if not exists assignee_id uuid references auth.users(id);

