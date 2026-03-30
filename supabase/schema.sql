-- ============================================================
--  Validate Portal — Supabase Schema
--  Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Enable UUID extension (enabled by default in Supabase)
create extension if not exists "pgcrypto";

-- ── Tables ──────────────────────────────────────────────────

create table if not exists projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  slug        text not null unique,
  description text,
  archived    boolean not null default false,
  target_interviews int not null default 20,
  target_surveys    int not null default 50,
  settings    jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists questions (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references projects(id) on delete cascade,
  type          text not null check (type in ('text','long_text','scale','rating','choice','multi_choice','yes_no')),
  label         text not null,
  options       text[],
  required      boolean not null default false,
  display_order int not null default 0,
  created_at    timestamptz not null default now()
);

create table if not exists interviews (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references projects(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  participant  text,
  region       text,
  pain_scores  jsonb not null default '{}',
  quotes       text[] not null default '{}',
  tags         text[] not null default '{}',
  notes        text,
  pilot_ready  boolean not null default false,
  interviewed_at timestamptz not null default now(),
  created_at   timestamptz not null default now()
);

create table if not exists survey_responses (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references projects(id) on delete cascade,
  answers      jsonb not null default '{}',
  region       text,
  submitted_at timestamptz not null default now()
);

create table if not exists analysis_cache (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  result     jsonb not null,
  created_at timestamptz not null default now()
);

-- ── Indexes ──────────────────────────────────────────────────

create index if not exists idx_projects_user_id    on projects(user_id);
create index if not exists idx_projects_slug       on projects(slug);
create index if not exists idx_questions_project   on questions(project_id, display_order);
create index if not exists idx_interviews_project  on interviews(project_id);
create index if not exists idx_surveys_project     on survey_responses(project_id);
create index if not exists idx_cache_project       on analysis_cache(project_id, created_at desc);

-- ── updated_at trigger ────────────────────────────────────────

create or replace function handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger projects_updated_at
  before update on projects
  for each row execute procedure handle_updated_at();

-- ── Row Level Security ────────────────────────────────────────

alter table projects          enable row level security;
alter table questions         enable row level security;
alter table interviews        enable row level security;
alter table survey_responses  enable row level security;
alter table analysis_cache    enable row level security;

-- projects: owner full access
drop policy if exists "projects: owner all" on "projects";
create policy "projects: owner all"
  on "projects" for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- questions: owner of the parent project
drop policy if exists "questions: project owner all" on "questions";
create policy "questions: project owner all"
  on "questions" for all
  using (
    project_id in (select id from "projects" where user_id = auth.uid())
  )
  with check (
    project_id in (select id from "projects" where user_id = auth.uid())
  );

-- questions: anon can read
drop policy if exists "questions: anon read" on "questions";
create policy "questions: anon read"
  on "questions" for select
  using (true);

-- projects: anon can read non-archived
drop policy if exists "projects: anon read non-archived" on "projects";
create policy "projects: anon read non-archived"
  on "projects" for select
  using (archived = false);

-- interviews: owner of project
drop policy if exists "interviews: project owner all" on "interviews";
create policy "interviews: project owner all"
  on "interviews" for all
  using (
    user_id = auth.uid()
    and project_id in (select id from "projects" where user_id = auth.uid())
  )
  with check (
    user_id = auth.uid()
    and project_id in (select id from "projects" where user_id = auth.uid())
  );

-- survey_responses: anyone can insert
drop policy if exists "survey_responses: public insert" on "survey_responses";
create policy "survey_responses: public insert"
  on "survey_responses" for insert
  with check (true);

-- survey_responses: owner of project can read
drop policy if exists "survey_responses: project owner read" on "survey_responses";
create policy "survey_responses: project owner read"
  on "survey_responses" for select
  using (
    project_id in (select id from "projects" where user_id = auth.uid())
  );

-- analysis_cache: owner of project
drop policy if exists "analysis_cache: project owner all" on "analysis_cache";
create policy "analysis_cache: project owner all"
  on "analysis_cache" for all
  using (
    project_id in (select id from "projects" where user_id = auth.uid())
  )
  with check (
    project_id in (select id from "projects" where user_id = auth.uid())
  );