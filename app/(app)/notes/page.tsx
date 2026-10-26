import Link from "next/link";
import { Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createNote, toggleFavorite } from "./actions";

export default async function NotesPage({ searchParams }: { searchParams: Promise<{ q?: string; fav?: string }> }) {
  const { q = "", fav } = await searchParams;
  const term = q.replace(/[%,()*]/g, "").trim();
  const supabase = await createClient();
  let query = supabase.from("notes").select("id,title,content,tags,is_favorite,updated_at,subjects(name)").order("updated_at", { ascending: false });
  if (term) query = query.or(`title.ilike.%${term}%,content.ilike.%${term}%`);
  if (fav) query = query.eq("is_favorite", true);
  const { data } = await query;
  const notes = data ?? [];
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Notes</h1>
        <form action={createNote}><button className="btn">New note</button></form>
      </div>
      <form className="flex flex-wrap gap-2" role="search">
        <input name="q" defaultValue={term} placeholder="Search notes…" aria-label="Search notes" className="input flex-1" />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="fav" value="1" defaultChecked={!!fav} /> Favorites</label>
        <button className="rounded-lg border border-neutral-300 px-4 py-2 text-sm dark:border-neutral-700">Search</button>
      </form>
      {!notes.length ? <div className="card text-center text-sm text-neutral-500">{term || fav ? "No notes match your search." : "No notes yet. Create your first note to capture what you learn."}</div> : (
        <div className="grid gap-4 sm:grid-cols-2">
          {notes.map((n) => (
            <div key={n.id} className="card space-y-2">
              <div className="flex items-start justify-between gap-2">
                <Link href={`/notes/${n.id}`} className="font-medium hover:underline">{n.title}</Link>
                <form action={toggleFavorite.bind(null, n.id, n.is_favorite)}>
                  <button aria-label={n.is_favorite ? "Remove from favorites" : "Add to favorites"}><Star size={16} className={n.is_favorite ? "fill-amber-400 text-amber-400" : "text-neutral-400"} /></button>
                </form>
              </div>
              <p className="line-clamp-3 text-sm text-neutral-500">{n.content.slice(0, 160) || "Empty note"}</p>
              <p className="text-xs text-neutral-500">{[(n.subjects as unknown as { name: string } | null)?.name, ...n.tags.map((t: string) => `#${t}`)].filter(Boolean).join(" · ")}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
