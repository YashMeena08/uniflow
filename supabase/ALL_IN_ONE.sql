-- STUDENT OS: complete database setup. Paste this whole file into Supabase > SQL Editor and click Run (once, on a fresh project).

-- ===== schema =====
-- Run this whole file in Supabase > SQL Editor.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text, college text, degree text, branch text, semester int, graduation_year int,
  attendance_target int not null default 75, created_at timestamptz not null default now()
);
create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text not null, code text, professor text, credits int, color text default '#6366f1',
  created_at timestamptz not null default now()
);
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  subject_id uuid references public.subjects(id) on delete set null,
  title text not null check (char_length(title) between 1 and 200),
  description text, due_date date, due_time time,
  priority text not null default 'medium' check (priority in ('low','medium','high','urgent')),
  status text not null default 'todo' check (status in ('todo','in_progress','completed')),
  tags text[] not null default '{}', completed_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.tasks (user_id, due_date);

alter table public.profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.tasks enable row level security;
create policy "own profile" on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy "own subjects" on public.subjects for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own tasks" on public.tasks for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- auto-create a profile on signup
create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name) values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- demo data for the logged-in user: select public.seed_demo_data();
create function public.seed_demo_data() returns void language plpgsql security invoker as $$
declare dsa uuid; dbms uuid; os_ uuid; cn uuid;
begin
  insert into subjects (name, code) values ('Data Structures & Algorithms','CS201') returning id into dsa;
  insert into subjects (name, code) values ('Database Management Systems','CS203') returning id into dbms;
  insert into subjects (name, code) values ('Operating Systems','CS205') returning id into os_;
  insert into subjects (name, code) values ('Computer Networks','CS207') returning id into cn;
  insert into subjects (name, code) values ('Software Engineering','CS209');
  insert into tasks (subject_id,title,due_date,priority,status,completed_at) values
    (dsa,'Solve 5 array problems',current_date,'high','completed',now()),
    (dbms,'DBMS assignment: ER diagram',current_date+1,'urgent','todo',null),
    (cn,'Computer Networks lab report',current_date+3,'medium','in_progress',null),
    (os_,'Revise process scheduling',current_date,'medium','todo',null),
    (dsa,'Finish DSA sheet',current_date+5,'high','todo',null),
    (dbms,'Revise normalization',current_date-1,'medium','todo',null);
end $$;

-- ===== batch2 =====
-- Batch 2: run in Supabase > SQL Editor (after schema.sql)
create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  subject_id uuid references public.subjects(id) on delete set null,
  title text not null check (char_length(title) between 1 and 200),
  description text, deadline date,
  priority text not null default 'medium' check (priority in ('low','medium','high','urgent')),
  status text not null default 'not_started' check (status in ('not_started','in_progress','submitted','completed')),
  submission_link text, notes text, created_at timestamptz not null default now()
);
create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  class_date date not null default current_date,
  status text not null check (status in ('present','absent')),
  unique (subject_id, class_date)
);
alter table public.assignments enable row level security;
alter table public.attendance_records enable row level security;
create policy "own assignments" on public.assignments for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own attendance" on public.attendance_records for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ===== batch3 =====
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

-- ===== batch4 =====
-- Batch 4: run in Supabase > SQL Editor (after batch3.sql)
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  subject_id uuid references public.subjects(id) on delete set null,
  title text not null check (char_length(title) between 1 and 200),
  content text not null default '' check (char_length(content) <= 50000),
  tags text[] not null default '{}',
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.notes (user_id, updated_at desc);
alter table public.notes enable row level security;
create policy "own notes" on public.notes for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ===== batch5 =====
-- Batch 5: run in Supabase > SQL Editor (after batch4.sql)
alter table public.profiles
  add column if not exists onboarded boolean not null default false,
  add column if not exists goals text[] not null default '{}',
  add column if not exists timezone text not null default 'UTC',
  add column if not exists pomodoro_focus int not null default 25 check (pomodoro_focus between 1 and 120),
  add column if not exists pomodoro_short int not null default 5 check (pomodoro_short between 1 and 60),
  add column if not exists pomodoro_long int not null default 15 check (pomodoro_long between 1 and 120),
  add column if not exists daily_study_goal_min int not null default 180 check (daily_study_goal_min between 15 and 1440);
