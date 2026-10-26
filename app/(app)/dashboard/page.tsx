import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { dayKey as dayKeyTz, fmtDur } from "@/lib/dates";
import { getTimezone } from "@/lib/profile";

export default async function Dashboard() {
  const tz = await getTimezone();
  const dayKey = (n = 0) => dayKeyTz(n, tz);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("full_name,daily_study_goal_min").eq("id", user!.id).single();
  const { data: tasks } = await supabase.from("tasks").select("id,title,due_date,status,priority");
  const { data: sessions } = await supabase.from("study_sessions").select("session_date,duration_seconds").gte("session_date", dayKey(-60));
  const perDay = new Map<string, number>();
  (sessions ?? []).forEach((x) => perDay.set(x.session_date, (perDay.get(x.session_date) ?? 0) + x.duration_seconds));
  const week = Array.from({ length: 7 }, (_, i) => perDay.get(dayKey(-i)) ?? 0).reduce((a, b) => a + b, 0);
  let streak = 0;
  for (let i = perDay.has(dayKey(0)) ? 0 : 1; perDay.has(dayKey(-i)); i++) streak++;
  const today = dayKey(0);
  const all = tasks ?? [];
  const open = all.filter((t) => t.status !== "completed");
  const dueToday = all.filter((t) => t.due_date === today);
  const doneToday = dueToday.filter((t) => t.status === "completed").length;
  const overdue = open.filter((t) => t.due_date && t.due_date < today);
  const upcoming = open.filter((t) => t.due_date && t.due_date >= today).sort((a, b) => a.due_date!.localeCompare(b.due_date!)).slice(0, 5);
  const pct = dueToday.length ? Math.round((doneToday / dueToday.length) * 100) : 0;
  const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", hour12: false }).format(new Date())) % 24;
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const first = profile?.full_name?.split(" ")[0] ?? "there";
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-semibold">{greet}, {first} 👋</h1>
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="card"><p className="text-sm text-neutral-500">Today&apos;s progress</p><p className="text-2xl font-semibold">{pct}%</p>
          <div className="mt-2 h-2 rounded bg-neutral-200 dark:bg-neutral-800"><div className="h-2 rounded bg-indigo-600" style={{ width: `${pct}%` }} /></div>
          <p className="mt-2 text-xs text-neutral-500">{doneToday} / {dueToday.length} tasks completed</p></div>
        <div className="card"><p className="text-sm text-neutral-500">Overdue</p><p className={`text-2xl font-semibold ${overdue.length ? "text-red-600" : ""}`}>{overdue.length}</p></div>
        <div className="card"><p className="text-sm text-neutral-500">Open tasks</p><p className="text-2xl font-semibold">{open.length}</p></div>
      </section>
      <section className="grid gap-4 sm:grid-cols-3" aria-label="Study statistics">
        <div className="card"><p className="text-sm text-neutral-500">Studied today</p><p className="text-2xl font-semibold">{fmtDur(perDay.get(dayKey(0)) ?? 0)}</p><p className="text-xs text-neutral-500">Goal: {fmtDur((profile?.daily_study_goal_min ?? 180) * 60)}</p></div>
        <div className="card"><p className="text-sm text-neutral-500">Last 7 days</p><p className="text-2xl font-semibold">{fmtDur(week)}</p></div>
        <div className="card"><p className="text-sm text-neutral-500">Study streak</p><p className="text-2xl font-semibold">{streak} {streak === 1 ? "day" : "days"}</p><Link href="/study" className="text-xs text-indigo-600">Start a session</Link></div>
      </section>
      <section className="card">
        <h2 className="mb-3 font-medium">Upcoming deadlines</h2>
        {upcoming.length ? (
          <ul className="space-y-2 text-sm">{upcoming.map((t) => <li key={t.id} className="flex justify-between"><span>{t.title}</span><span className="text-neutral-500">{t.due_date}</span></li>)}</ul>
        ) : (<p className="text-sm text-neutral-500">Nothing due soon. <Link href="/tasks" className="text-indigo-600">Add a task</Link></p>)}
      </section>
    </div>
  );
}
