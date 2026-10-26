import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/profile";
import { fmtDur } from "@/lib/dates";
import Timer from "@/components/study/timer";

export default async function StudyPage() {
  const supabase = await createClient();
  const p = await getProfile();
  const [{ data: subjects }, { data: recent }] = await Promise.all([
    supabase.from("subjects").select("id,name").order("name"),
    supabase.from("study_sessions").select("id,duration_seconds,session_date,subjects(name)").order("started_at", { ascending: false }).limit(5),
  ]);
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold">Study</h1>
      <Timer subjects={subjects ?? []} defaults={{ focus: p?.pomodoro_focus ?? 25, short: p?.pomodoro_short ?? 5, long: p?.pomodoro_long ?? 15 }} />
      <section className="card">
        <h2 className="mb-3 font-medium">Recent sessions</h2>
        {!recent?.length ? <p className="text-sm text-neutral-500">No sessions yet. Start the timer to log your first one.</p> : (
          <ul className="space-y-2 text-sm">
            {recent.map((s) => (
              <li key={s.id} className="flex justify-between"><span>{(s.subjects as unknown as { name: string } | null)?.name ?? "No subject"}</span>
                <span className="text-neutral-500">{fmtDur(s.duration_seconds)} · {s.session_date}</span></li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
