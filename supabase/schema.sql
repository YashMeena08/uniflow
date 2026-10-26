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
