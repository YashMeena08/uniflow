-- Batch 3: run in Supabase > SQL Editor (after batch2.sql)
create table public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  subject_id uuid references public.subjects(id) on delete set null,
  duration_seconds int not null check (duration_seconds between 60 and 86400),
  session_date date not null,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index on public.study_sessions (user_id, session_date);
alter table public.study_sessions enable row level security;
create policy "own sessions" on public.study_sessions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
