-- Batch 5: run in Supabase > SQL Editor (after batch4.sql)
alter table public.profiles
  add column if not exists onboarded boolean not null default false,
  add column if not exists goals text[] not null default '{}',
  add column if not exists timezone text not null default 'UTC',
  add column if not exists pomodoro_focus int not null default 25 check (pomodoro_focus between 1 and 120),
  add column if not exists pomodoro_short int not null default 5 check (pomodoro_short between 1 and 60),
  add column if not exists pomodoro_long int not null default 15 check (pomodoro_long between 1 and 120),
  add column if not exists daily_study_goal_min int not null default 180 check (daily_study_goal_min between 15 and 1440);
