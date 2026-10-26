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
