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
