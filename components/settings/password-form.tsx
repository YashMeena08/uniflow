"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function PasswordForm() {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const pw = String(f.get("password"));
    if (pw.length < 8) return setMsg({ ok: false, text: "Use at least 8 characters." });
    if (pw !== f.get("confirm")) return setMsg({ ok: false, text: "Passwords do not match." });
    setBusy(true);
    const { error } = await createClient().auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return setMsg({ ok: false, text: error.message });
    form.reset(); setMsg({ ok: true, text: "Password updated." });
  }
  return (
    <form onSubmit={onSubmit} className="card space-y-3"><h2 className="font-medium">Password</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="password" type="password" autoComplete="new-password" placeholder="New password" aria-label="New password" className="input" />
        <input name="confirm" type="password" autoComplete="new-password" placeholder="Confirm password" aria-label="Confirm password" className="input" /></div>
      <div className="flex items-center gap-3"><button className="btn" disabled={busy}>{busy ? "Updating…" : "Update password"}</button>
        {msg && <p role="status" className={`text-sm ${msg.ok ? "text-green-600" : "text-red-600"}`}>{msg.text}</p>}</div>
    </form>
  );
}
