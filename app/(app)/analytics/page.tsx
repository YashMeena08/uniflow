import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { dayKey as dayKeyTz, fmtDur } from "@/lib/dates";
import { getTimezone } from "@/lib/profile";
import { DailyBar, SubjectDonut, TrendLine } from "@/components/analytics/charts";

const h = (s: number) => Math.round((s / 3600) * 100) / 100;

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const tz = await getTimezone();
  const dayKey = (n = 0) => dayKeyTz(n, tz);
  const { range } = await searchParams;
  const days = [7, 30, 90].includes(Number(range)) ? Number(range) : 7;
  const supabase = await createClient();
  const [{ data: sessions }, { data: done }] = await Promise.all([
    supabase.from("study_sessions").select("session_date,duration_seconds,subjects(name)").gte("session_date", dayKey(-120)),
    supabase.from("tasks").select("completed_at").not("completed_at", "is", null).gte("completed_at", dayKey(-(days - 1))),
  ]);
  const all = sessions ?? [];
  const perDay = new Map<string, number>();
  all.forEach((s) => perDay.set(s.session_date, (perDay.get(s.session_date) ?? 0) + s.duration_seconds));
  const keys = Array.from({ length: days }, (_, i) => dayKey(i - (days - 1)));
  const inRange = keys.reduce((a, k) => a + (perDay.get(k) ?? 0), 0);
  const sumLast = (n: number) => Array.from({ length: n }, (_, i) => perDay.get(dayKey(-i)) ?? 0).reduce((a, b) => a + b, 0);
  let streak = 0;
  for (let i = perDay.has(dayKey(0)) ? 0 : 1; perDay.has(dayKey(-i)); i++) streak++;
  const rangeSessions = all.filter((s) => s.session_date >= keys[0]);
  const bySubject = new Map<string, number>();
  rangeSessions.forEach((s) => {
    const n = (s.subjects as unknown as { name: string } | null)?.name ?? "No subject";
    bySubject.set(n, (bySubject.get(n) ?? 0) + s.duration_seconds);
  });
  const tasksPerDay = new Map<string, number>();
  (done ?? []).forEach((t) => { const k = new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date(t.completed_at)); tasksPerDay.set(k, (tasksPerDay.get(k) ?? 0) + 1); });
  const stats = [
    ["Today", fmtDur(perDay.get(dayKey(0)) ?? 0)], ["Last 7 days", fmtDur(sumLast(7))], ["Last 30 days", fmtDur(sumLast(30))],
    ["Study streak", `${streak} ${streak === 1 ? "day" : "days"}`],
    ["Avg session", rangeSessions.length ? fmtDur(Math.round(inRange / rangeSessions.length)) : "—"],
    ["Avg per day", fmtDur(Math.round(inRange / days))],
  ];
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <nav className="flex gap-2 text-sm" aria-label="Date range">
          {[7, 30, 90].map((d) => (
            <Link key={d} href={`/analytics?range=${d}`} className={`rounded-full px-3 py-1 ${days === d ? "bg-indigo-600 text-white" : "border border-neutral-300 dark:border-neutral-700"}`}>{d} days</Link>
          ))}
        </nav>
      </div>
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {stats.map(([l, v]) => <div key={l} className="card"><p className="text-sm text-neutral-500">{l}</p><p className="text-xl font-semibold">{v}</p></div>)}
      </section>
      {!all.length ? <div className="card text-center text-sm text-neutral-500">No study data yet. Save a session from the Study page to see your charts.</div> : (
        <>
          <section className="card"><h2 className="mb-3 font-medium">Daily study time</h2>
            <DailyBar data={keys.map((k) => ({ label: k.slice(5), hours: h(perDay.get(k) ?? 0) }))} /></section>
          <section className="card"><h2 className="mb-3 font-medium">By subject</h2>
            {bySubject.size ? <SubjectDonut data={[...bySubject].map(([name, s]) => ({ name, hours: h(s) }))} /> : <p className="text-sm text-neutral-500">No sessions in this range.</p>}</section>
        </>
      )}
      <section className="card"><h2 className="mb-1 font-medium">Productivity trend</h2>
        <p className="mb-3 text-xs text-neutral-500">Tasks completed per day</p>
        <TrendLine data={keys.map((k) => ({ label: k.slice(5), tasks: tasksPerDay.get(k) ?? 0 }))} /></section>
    </div>
  );
}
