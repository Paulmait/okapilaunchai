-- OkapiLaunch AI - minimal schema
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  type text not null,
  status text not null default 'queued',
  payload jsonb not null default '{}'::jsonb,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_decisions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id text not null,
  task text not null,
  decision jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_runs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id text not null,
  task text not null,
  provider text not null,
  model text not null,
  ok boolean not null,
  error text,
  usage jsonb,
  cost_usd_est numeric,
  created_at timestamptz not null default now()
);
