import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { dayKey as dayKeyTz, fmtDur } from "@/lib/dates";
import { getTimezone } from "@/lib/profile";
import { addTask } from "../tasks/actions";

type Item = { type: "task" | "assignment" | "study"; label: string; done?: boolean };
const COLOR = { task: "bg-indigo-500", assignment: "bg-amber-500", study: "bg-green-500" } as const;
const NAME = { task: "Task", assignment: "Assignment", study: "Study" } as const;

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ m?: string; d?: string }> }) {
  const tz = await getTimezone();
  const dayKey = (n = 0) => dayKeyTz(n, tz);
  const sp = await searchParams;
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(sp.m ?? "") ? sp.m! : dayKey(0).slice(0, 7);
  const [y, mo] = month.split("-").map(Number);
  const daysIn = new Date(Date.UTC(y, mo, 0)).getUTCDate();
  const lead = (new Date(Date.UTC(y, mo - 1, 1)).getUTCDay() + 6) % 7; // week starts Monday
  const start = `${month}-01`, end = `${month}-${String(daysIn).padStart(2, "0")}`;
  const supabase = await createClient();
  const [{ data: tasks }, { data: asg }, { data: ses }] = await Promise.all([
    supabase.from("tasks").select("title,status,due_date").gte("due_date", start).lte("due_date", end),
    supabase.from("assignments").select("title,status,deadline").gte("deadline", start).lte("deadline", end),
    supabase.from("study_sessions").select("session_date,duration_seconds").gte("session_date", start).lte("session_date", end),
  ]);
  const byDay = new Map<string, Item[]>();
  const push = (d: string | null, it: Item) => { if (d) byDay.set(d, [...(byDay.get(d) ?? []), it]); };
  tasks?.forEach((t) => push(t.due_date, { type: "task", label: t.title, done: t.status === "completed" }));
  asg?.forEach((a) => push(a.deadline, { type: "assignment", label: a.title, done: a.status === "completed" || a.status === "submitted" }));
  const study = new Map<string, number>();
  ses?.forEach((s) => study.set(s.session_date, (study.get(s.session_date) ?? 0) + s.duration_seconds));
  study.forEach((sec, d) => push(d, { type: "study", label: `Studied ${fmtDur(sec)}` }));

  const shift = (n: number) => new Date(Date.UTC(y, mo - 1 + n, 1)).toISOString().slice(0, 7);
  const label = new Date(Date.UTC(y, mo - 1, 1)).toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  const selected = sp.d && /^\d{4}-\d{2}-\d{2}$/.test(sp.d) && sp.d.startsWith(month) ? sp.d : null;
  const today = dayKey(0);
  const cells: (string | null)[] = [...Array(lead).fill(null), ...Array.from({ length: daysIn }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`)];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{label}</h1>
        <nav className="flex gap-2 text-sm" aria-label="Month">
          <Link href={`/calendar?m=${shift(-1)}`} className="rounded-lg border border-neutral-300 px-3 py-1 dark:border-neutral-700">‹ Prev</Link>
          <Link href="/calendar" className="rounded-lg border border-neutral-300 px-3 py-1 dark:border-neutral-700">Today</Link>
          <Link href={`/calendar?m=${shift(1)}`} className="rounded-lg border border-neutral-300 px-3 py-1 dark:border-neutral-700">Next ›</Link>
        </nav>
      </div>
      <div className="flex gap-4 text-xs text-neutral-500">
        {(Object.keys(COLOR) as (keyof typeof COLOR)[]).map((k) => <span key={k} className="flex items-center gap-1"><span className={`h-2 w-2 rounded-full ${COLOR[k]}`} />{NAME[k]}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-neutral-500">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d}>{d}</div>)}</div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <div key={`b${i}`} />;
          const items = byDay.get(d) ?? [];
          return (
            <Link key={d} href={`/calendar?m=${month}&d=${d}`} aria-label={`${d}, ${items.length} items`}
              className={`min-h-16 rounded-lg border p-1 text-left text-xs md:min-h-24 ${selected === d ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950" : "border-neutral-200 dark:border-neutral-800"} ${d === today ? "ring-2 ring-indigo-500" : ""}`}>
              <span className="font-medium">{Number(d.slice(8))}</span>
              <span className="mt-1 flex flex-wrap gap-0.5 md:hidden">{items.slice(0, 6).map((it, j) => <span key={j} className={`h-1.5 w-1.5 rounded-full ${COLOR[it.type]}`} />)}</span>
              <span className="mt-1 hidden space-y-0.5 md:block">
                {items.slice(0, 2).map((it, j) => <span key={j} className="flex items-center gap-1 truncate"><span className={`h-1.5 w-1.5 shrink-0 rounded-full ${COLOR[it.type]}`} /><span className="truncate">{it.label}</span></span>)}
                {items.length > 2 && <span className="block text-neutral-500">+{items.length - 2} more</span>}
              </span>
            </Link>
          );
        })}
      </div>
      {selected && (
        <section className="card space-y-4">
          <h2 className="font-medium">{selected}</h2>
          {(byDay.get(selected) ?? []).length ? (
            <ul className="space-y-2 text-sm">
              {byDay.get(selected)!.map((it, i) => (
                <li key={i} className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${COLOR[it.type]}`} />
                  <span className={it.done ? "line-through text-neutral-400" : ""}>{it.label}</span><span className="text-xs text-neutral-500">{NAME[it.type]}</span></li>
              ))}
            </ul>
          ) : <p className="text-sm text-neutral-500">Nothing scheduled for this day.</p>}
          <form action={addTask} className="flex flex-wrap gap-2 border-t border-neutral-200 pt-4 dark:border-neutral-800">
            <input type="hidden" name="due_date" value={selected} />
            <input name="title" required placeholder="Add a task for this day" aria-label="Task title" className="input flex-1" />
            <select name="priority" defaultValue="medium" aria-label="Priority" className="input w-auto"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select>
            <button className="btn">Add</button>
          </form>
        </section>
      )}
    </div>
  );
}
