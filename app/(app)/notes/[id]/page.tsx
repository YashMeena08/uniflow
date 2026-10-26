import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NoteEditor from "@/components/notes/editor";
import { deleteNote } from "../actions";

export default async function NotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const [{ data: note }, { data: subjects }] = await Promise.all([
    supabase.from("notes").select("id,title,content,subject_id,tags").eq("id", id).maybeSingle(),
    supabase.from("subjects").select("id,name").order("name"),
  ]);
  if (!note) notFound();
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex justify-between text-sm">
        <Link href="/notes" className="text-indigo-600">← All notes</Link>
        <form action={deleteNote.bind(null, id)}><button className="text-red-600">Delete note</button></form>
      </div>
      <NoteEditor id={note.id} title={note.title} content={note.content} subjectId={note.subject_id} tags={note.tags} subjects={subjects ?? []} />
    </div>
  );
}
