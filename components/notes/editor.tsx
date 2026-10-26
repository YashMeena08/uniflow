"use client";
import { useState, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import { updateNote } from "@/app/(app)/notes/actions";

type Props = { id: string; title: string; content: string; subjectId: string | null; tags: string[]; subjects: { id: string; name: string }[] };

export default function NoteEditor(p: Props) {
  const [title, setTitle] = useState(p.title);
  const [content, setContent] = useState(p.content);
  const [subject, setSubject] = useState(p.subjectId ?? "");
  const [tags, setTags] = useState(p.tags.join(", "));
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, start] = useTransition();

  function save() {
    start(async () => {
      const res = await updateNote(p.id, {
        title: title.trim() || "Untitled note", content, subject_id: subject || null,
        tags: tags.split(",").map((t) => t.trim().replace(/^#/, "")).filter(Boolean).slice(0, 10),
      });
      setMsg(res.ok ? "Note saved." : "Unable to save note. Please try again.");
    });
  }
  return (
    <div className="space-y-4">
      <input value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Title" className="input text-lg font-semibold" maxLength={200} />
      <div className="grid gap-3 sm:grid-cols-2">
        <select value={subject} onChange={(e) => setSubject(e.target.value)} aria-label="Subject" className="input"><option value="">No subject</option>
          {p.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
        <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Tags, comma separated" aria-label="Tags" className="input" />
      </div>
      <div className="flex gap-2 md:hidden" role="group" aria-label="View">
        {(["edit", "preview"] as const).map((t) => <button key={t} onClick={() => setTab(t)} aria-pressed={tab === t} className={`rounded-full px-3 py-1 text-sm capitalize ${tab === t ? "bg-indigo-600 text-white" : "border border-neutral-300 dark:border-neutral-700"}`}>{t}</button>)}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <textarea value={content} onChange={(e) => setContent(e.target.value)} aria-label="Content (Markdown)" placeholder="Write in Markdown…" rows={18}
          className={`input font-mono ${tab === "preview" ? "hidden md:block" : ""}`} />
        <div className={`card md min-h-40 overflow-auto ${tab === "edit" ? "hidden md:block" : ""}`}>
          {content.trim() ? <ReactMarkdown>{content}</ReactMarkdown> : <p className="text-sm text-neutral-500">Preview appears here.</p>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving} className="btn">{saving ? "Saving…" : "Save"}</button>
        {msg && <p role="status" className="text-sm text-neutral-500">{msg}</p>}
      </div>
    </div>
  );
}
