"use client";
import { useActionState } from "react";

export type State = { ok: boolean; message: string } | null;

export default function FormShell({ action, title, children }: { action: (s: State, f: FormData) => Promise<State>; title: string; children: React.ReactNode }) {
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction} className="card space-y-4">
      <h2 className="font-medium">{title}</h2>
      {children}
      <div className="flex items-center gap-3">
        <button className="btn" disabled={pending}>{pending ? "Saving…" : "Save"}</button>
        {state && <p role="status" className={`text-sm ${state.ok ? "text-green-600" : "text-red-600"}`}>{state.message}</p>}
      </div>
    </form>
  );
}
