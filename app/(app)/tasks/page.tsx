import { createClient } from "@/lib/supabase/server";
import { addTask, toggleTask, deleteTask } from "./actions";

export default async function TasksPage() {
  const supabase = await createClient();
  const [{ data: tasks }, { data: subjects }] = await Promise.all([
    supabase.from("tasks").select("id,title,due_date,priority,status,subjects(name)").order("status").order("due_date", { nullsFirst: false }),
    supabase.from("subjects").select("id,name").order("name"),
  ]);
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Tasks</h1>
      <form action={addTask} className="card grid gap-3 sm:grid-cols-2">
        <input name="title" placeholder="What needs to be done?" aria-label="Title" required className="input sm:col-span-2" />
        <input name="due_date" type="date" aria-label="Due date" className="input" />
        <select name="priority" aria-label="Priority" defaultValue="medium" className="input">
          <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
        </select>
        <select name="subject_id" aria-label="Subject" className="input"><option value="">No subject</option>
          {subjects?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button className="btn">Add task</button>
      </form>
      {!tasks?.length ? (
        <div className="card text-center text-sm text-neutral-500">No tasks yet. Create your first task to start organizing your day.</div>
      ) : (
        <ul className="space-y-2">
          {tasks.map((t) => {
            const done = t.status === "completed";
            const subj = (t.subjects as unknown as { name: string } | null)?.name;
            return (
              <li key={t.id} className="card flex items-center gap-3 py-3">
                <form action={toggleTask.bind(null, t.id, done)}>
                  <button aria-label={done ? "Mark as not done" : "Mark as done"} className={`h-5 w-5 rounded border ${done ? "bg-indigo-600 border-indigo-600" : "border-neutral-400"}`} />
                </form>
                <div className="flex-1">
                  <p className={done ? "text-neutral-400 line-through" : ""}>{t.title}</p>
                  <p className="text-xs text-neutral-500">{[subj, t.priority, t.due_date].filter(Boolean).join(" · ")}</p>
                </div>
                <form action={deleteTask.bind(null, t.id)}><button className="text-xs text-red-600">Delete</button></form>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
