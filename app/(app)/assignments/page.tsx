import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { dayKey as dayKeyTz } from "@/lib/dates";
import { getTimezone } from "@/lib/profile";
import { addAssignment, setAssignmentStatus, deleteAssignment } from "./actions";

const LABEL: Record<string, string> = { not_started: "Not started", in_progress: "In progress", submitted: "Submitted", completed: "Completed" };
const TABS = ["all", "upcoming", "overdue", "completed"] as const;

export default async function AssignmentsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const tz = await getTimezone();
  const dayKey = (n = 0) => dayKeyTz(n, tz);
  const { view = "all" } = await searchParams;
  const supabase = await createClient();
  const [{ data }, { data: subjects }] = await Promise.all([
    supabase.from("assignments").select("id,title,deadline,priority,status,submission_link,subjects(name)").order("deadline", { nullsFirst: false }),
    supabase.from("subjects").select("id,name").order("name"),
  ]);
  const today = dayKey(0);
  const isDone = (s: string) => s === "completed" || s === "submitted";
  const list = (data ?? []).filter((a) =>
    view === "completed" ? isDone(a.status)
    : view === "overdue" ? !isDone(a.status) && !!a.deadline && a.deadline < today
    : view === "upcoming" ? !isDone(a.status) && (!a.deadline || a.deadline >= today)
    : true);
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Assignments</h1>
      <form action={addAssignment} className="card grid gap-3 sm:grid-cols-2">
        <input name="title" placeholder="Assignment title" aria-label="Title" required className="input sm:col-span-2" />
        <select name="subject_id" aria-label="Subject" className="input"><option value="">No subject</option>
          {subjects?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
        <input name="deadline" type="date" aria-label="Deadline" className="input" />
        <select name="priority" aria-label="Priority" defaultValue="medium" className="input">
          <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select>
        <input name="submission_link" type="url" placeholder="Submission link (optional)" aria-label="Submission link" className="input" />
        <button className="btn sm:col-span-2">Add assignment</button>
      </form>
      <nav className="flex gap-2 text-sm" aria-label="Filter">
        {TABS.map((t) => (
          <Link key={t} href={`/assignments?view=${t}`} className={`rounded-full px-3 py-1 capitalize ${view === t ? "bg-indigo-600 text-white" : "border border-neutral-300 dark:border-neutral-700"}`}>{t}</Link>
        ))}
      </nav>
      {!list.length ? <div className="card text-center text-sm text-neutral-500">Nothing here. Add an assignment to track your deadlines.</div> : (
        <ul className="space-y-2">
          {list.map((a) => {
            const overdue = !isDone(a.status) && a.deadline && a.deadline < today;
            return (
              <li key={a.id} className="card flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{a.title}</p>
                  <p className="text-xs text-neutral-500">
                    {[(a.subjects as unknown as { name: string } | null)?.name, a.priority, a.deadline].filter(Boolean).join(" · ")}
                    {overdue && <span className="ml-2 font-medium text-red-600">Overdue</span>}
                  </p>
                  {a.submission_link && <a href={a.submission_link} target="_blank" rel="noreferrer" className="text-xs text-indigo-600">Submission link</a>}
                </div>
                <form action={setAssignmentStatus} className="flex gap-2">
                  <input type="hidden" name="id" value={a.id} />
                  <select name="status" defaultValue={a.status} aria-label="Status" className="input w-auto py-1">
                    {Object.entries(LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
                  <button className="text-xs text-indigo-600">Save</button>
                </form>
                <form action={deleteAssignment.bind(null, a.id)}><button className="text-xs text-red-600">Delete</button></form>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
