import { createClient } from "@/lib/supabase/server";
import { dayKey as dayKeyTz } from "@/lib/dates";
import { getTimezone } from "@/lib/profile";
import { attendanceStats } from "@/lib/attendance";
import { markAttendance, updateTarget } from "./actions";

export default async function AttendancePage() {
  const tz = await getTimezone();
  const dayKey = (n = 0) => dayKeyTz(n, tz);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: profile }, { data: subjects }] = await Promise.all([
    supabase.from("profiles").select("attendance_target").eq("id", user!.id).single(),
    supabase.from("subjects").select("id,name,attendance_records(status)").order("name"),
  ]);
  const target = profile?.attendance_target ?? 75;
  const today = dayKey(0);
  const rows = (subjects ?? []).map((s) => {
    const recs = s.attendance_records as { status: string }[];
    return { ...s, st: attendanceStats(recs.filter((r) => r.status === "present").length, recs.length, target) };
  });
  const sum = rows.reduce((a, r) => ({ p: a.p + r.st.attended, t: a.t + r.st.total }), { p: 0, t: 0 });
  const overall = sum.t ? Math.round((sum.p / sum.t) * 100) : null;
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-2xl font-semibold">Attendance</h1>
          <p className="text-sm text-neutral-500">Overall: {overall === null ? "no classes logged yet" : `${overall}%`} · Target: {target}%</p></div>
        <form action={updateTarget} className="flex items-center gap-2">
          <label htmlFor="target" className="text-sm">Target %</label>
          <input id="target" name="target" type="number" min={1} max={100} defaultValue={target} className="input w-20 py-1" />
          <button className="text-sm text-indigo-600">Save</button>
        </form>
      </div>
      {!rows.length ? <div className="card text-center text-sm text-neutral-500">Add subjects first, then log your classes here.</div> : rows.map((r) => {
        const { st } = r;
        return (
          <section key={r.id} className="card space-y-3">
            <div className="flex justify-between"><h2 className="font-medium">{r.name}</h2>
              <span className={`text-sm font-medium ${st.pct === null ? "" : st.safe ? "text-green-600" : "text-red-600"}`}>{st.pct === null ? "—" : `${st.pct.toFixed(1)}%`}</span></div>
            <div className="h-2 rounded bg-neutral-200 dark:bg-neutral-800"><div className={`h-2 rounded ${st.safe ? "bg-green-600" : "bg-red-600"}`} style={{ width: `${Math.min(100, st.pct ?? 0)}%` }} /></div>
            <p className="text-xs text-neutral-500">{st.attended} attended of {st.total} classes</p>
            {st.total === 0 ? <p className="text-sm text-neutral-500">Log your first class below.</p>
              : st.impossible ? <p className="text-sm text-red-600">A {target}% target can no longer be reached for this subject.</p>
              : st.safe ? <p className="text-sm text-green-700 dark:text-green-500">You&apos;re on track. You can miss up to {st.canMiss} more {st.canMiss === 1 ? "class" : "classes"} and stay at {target}%.</p>
              : <p className="text-sm text-red-600">⚠ Below target. Attend the next {st.needed} {st.needed === 1 ? "class" : "classes"} in a row without missing any to reach {target}%.</p>}
            <form action={markAttendance} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="subject_id" value={r.id} />
              <input type="date" name="class_date" defaultValue={today} max={today} aria-label="Class date" className="input w-auto py-1" />
              <button name="status" value="present" className="btn py-1">Present</button>
              <button name="status" value="absent" className="rounded-lg border border-neutral-300 px-4 py-1 text-sm dark:border-neutral-700">Absent</button>
            </form>
          </section>
        );
      })}
    </div>
  );
}
