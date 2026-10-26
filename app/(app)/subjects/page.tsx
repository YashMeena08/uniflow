import { createClient } from "@/lib/supabase/server";
import { addSubject, deleteSubject, seedDemo } from "./actions";

type Row = { id: string; name: string; code: string | null; professor: string | null; credits: number | null;
  assignments: { status: string }[]; attendance_records: { status: string }[] };

export default async function SubjectsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("subjects").select("id,name,code,professor,credits,assignments(status),attendance_records(status)").order("name");
  const subjects = (data ?? []) as Row[];
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-semibold">Subjects</h1>
      <form action={addSubject} className="card grid gap-3 sm:grid-cols-4">
        <input name="name" placeholder="Subject name" aria-label="Subject name" required className="input sm:col-span-2" />
        <input name="code" placeholder="Code" aria-label="Code" className="input" />
        <input name="credits" type="number" min={0} max={30} placeholder="Credits" aria-label="Credits" className="input" />
        <input name="professor" placeholder="Professor" aria-label="Professor" className="input sm:col-span-3" />
        <button className="btn">Add subject</button>
      </form>
      {!subjects.length ? (
        <div className="card space-y-3 text-center text-sm text-neutral-500">
          <p>No subjects yet. Add your first subject, or load sample data to explore the app.</p>
          <form action={seedDemo}><button className="btn">Load demo data</button></form>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {subjects.map((s) => {
            const present = s.attendance_records.filter((r) => r.status === "present").length;
            const total = s.attendance_records.length;
            const done = s.assignments.filter((a) => a.status === "completed" || a.status === "submitted").length;
            return (
              <div key={s.id} className="card space-y-2">
                <div className="flex items-start justify-between">
                  <div><p className="font-medium">{s.name}</p><p className="text-xs text-neutral-500">{[s.code, s.professor, s.credits ? `${s.credits} credits` : null].filter(Boolean).join(" · ")}</p></div>
                  <form action={deleteSubject.bind(null, s.id)}><button className="text-xs text-red-600" aria-label={`Delete ${s.name}`}>Delete</button></form>
                </div>
                <p className="text-sm">Attendance: {total ? `${Math.round((present / total) * 100)}%` : "no classes logged"}</p>
                <p className="text-sm">Assignments: {done} / {s.assignments.length} done</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
