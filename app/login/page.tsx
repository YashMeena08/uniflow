"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register" | "reset">("login");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true); setMsg(null);
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email")); const password = String(f.get("password"));
    const supabase = createClient();
    if (mode === "reset") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/auth/callback?next=/settings` });
      setMsg(error ? error.message : "If that email exists, a reset link is on its way.");
      setLoading(false); return;
    }
    if (mode === "register") {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${location.origin}/auth/callback`, data: { full_name: String(f.get("name") ?? "") } } });
      if (error) setMsg(error.message);
      else if (!data.session) setMsg("Check your email to confirm your account, then log in.");
      else { router.push("/dashboard"); router.refresh(); }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg(error.message); else { router.push("/dashboard"); router.refresh(); }
    }
    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={onSubmit} className="card w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold">Student OS</h1>
        <p className="text-sm text-neutral-500">{mode === "login" ? "Welcome back." : "Create your account."}</p>
        {mode === "register" && (<div><label htmlFor="name" className="mb-1 block text-sm">Full name</label><input id="name" name="name" required className="input" /></div>)}
        <div><label htmlFor="email" className="mb-1 block text-sm">Email</label><input id="email" name="email" type="email" required className="input" /></div>
        {mode !== "reset" && <div><label htmlFor="password" className="mb-1 block text-sm">Password</label><input id="password" name="password" type="password" minLength={6} required className="input" /></div>}
        {msg && <p role="alert" className="text-sm text-red-600">{msg}</p>}
        <button className="btn w-full" disabled={loading}>{loading ? "Please wait…" : mode === "login" ? "Log in" : mode === "register" ? "Register" : "Send reset link"}</button>
        {mode === "login" && <button type="button" className="w-full text-sm text-neutral-500" onClick={() => { setMode("reset"); setMsg(null); }}>Forgot password?</button>}
        <button type="button" className="w-full text-sm text-indigo-600" onClick={() => { setMode(mode === "login" ? "register" : "login"); setMsg(null); }}>
          {mode === "login" ? "New here? Create an account" : "Already have an account? Log in"}
        </button>
      </form>
    </main>
  );
}
