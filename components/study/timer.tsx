"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { saveSession } from "@/app/(app)/study/actions";

type Subject = { id: string; name: string };
type Phase = "focus" | "short" | "long";
type Pending = { seconds: number; start: number; end: number };

const pad = (n: number) => String(n).padStart(2, "0");
const fmt = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${pad(m)}:${pad(s % 60)}`;
};
const localDate = (ms: number) => new Date(ms - new Date(ms).getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const LABEL: Record<Phase, string> = { focus: "Focus", short: "Short break", long: "Long break" };

export default function Timer({ subjects, defaults }: { subjects: Subject[]; defaults: { focus: number; short: number; long: number } }) {
  const [mode, setMode] = useState<"pomodoro" | "stopwatch">("pomodoro");
  const [cfg, setCfg] = useState(defaults);
  const [phase, setPhase] = useState<Phase>("focus");
  const [cycles, setCycles] = useState(0);
  const [running, setRunning] = useState(false);
  const [acc, setAcc] = useState(0);
  const [startTs, setStartTs] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [pending, setPending] = useState<Pending | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, startSave] = useTransition();
  const firstStart = useRef<number | null>(null);

  const elapsed = acc + (running && startTs ? now - startTs : 0);
  const target = mode === "pomodoro" ? cfg[phase] * 60000 : null;
  const shown = target !== null ? target - elapsed : elapsed;
  const idle = !running && acc === 0;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [running]);

  function stopClock() { setRunning(false); setAcc(0); setStartTs(null); firstStart.current = null; }

  useEffect(() => {
    if (!running || target === null || elapsed < target) return;
    const end = Date.now();
    if (phase === "focus") {
      setPending({ seconds: cfg.focus * 60, start: firstStart.current ?? end - target, end });
      const c = cycles + 1; setCycles(c); setPhase(c % 4 === 0 ? "long" : "short");
    } else setPhase("focus");
    stopClock();
  }, [running, target, elapsed, phase, cfg.focus, cycles]);

  function start() { const t = Date.now(); if (acc === 0) firstStart.current = t; setStartTs(t); setNow(t); setRunning(true); setMsg(null); }
  function pause() { setAcc(elapsed); setRunning(false); setStartTs(null); }
  function finish() {
    if (elapsed >= 60000) setPending({ seconds: Math.round(elapsed / 1000), start: firstStart.current ?? Date.now() - elapsed, end: Date.now() });
    else setMsg("Sessions shorter than 1 minute aren't saved.");
    stopClock();
  }
  function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!pending) return;
    const subject = String(new FormData(e.currentTarget).get("subject_id") || "");
    startSave(async () => {
      const res = await saveSession({
        subject_id: subject || null, duration_seconds: pending.seconds,
        started_at: new Date(pending.start).toISOString(), ended_at: new Date(pending.end).toISOString(),
        session_date: localDate(pending.start),
      });
      setMsg(res.ok ? "Study session saved." : "Unable to save session. Please try again.");
      if (res.ok) setPending(null);
    });
  }

  return (
    <div className="space-y-4">
      <div className="card space-y-5 text-center">
        <div className="flex justify-center gap-2" role="group" aria-label="Timer mode">
          {(["pomodoro", "stopwatch"] as const).map((m) => (
            <button key={m} disabled={!idle} onClick={() => setMode(m)} aria-pressed={mode === m}
              className={`rounded-full px-4 py-1 text-sm capitalize disabled:opacity-50 ${mode === m ? "bg-indigo-600 text-white" : "border border-neutral-300 dark:border-neutral-700"}`}>{m}</button>
          ))}
        </div>
        <p className="text-sm text-neutral-500">{mode === "pomodoro" ? `${LABEL[phase]} · session ${(cycles % 4) + 1} of 4` : "Stopwatch"}</p>
        <p role="timer" aria-live="off" className="text-6xl font-semibold tabular-nums">{fmt(shown)}</p>
        <div className="flex flex-wrap justify-center gap-2">
          {!running ? <button className="btn" onClick={start}>{acc > 0 ? "Resume" : "Start"}</button> : <button className="btn" onClick={pause}>Pause</button>}
          <button onClick={stopClock} className="rounded-lg border border-neutral-300 px-4 py-2 text-sm dark:border-neutral-700">Reset</button>
          {(mode === "stopwatch" || phase === "focus") && elapsed > 0 && <button onClick={finish} className="rounded-lg border border-neutral-300 px-4 py-2 text-sm dark:border-neutral-700">Finish &amp; save</button>}
        </div>
        {mode === "pomodoro" && (
          <div className="grid grid-cols-3 gap-3 text-left text-sm">
            {(["focus", "short", "long"] as const).map((k) => (
              <label key={k} className="space-y-1"><span className="block capitalize text-neutral-500">{k} (min)</span>
                <input type="number" min={1} max={120} disabled={!idle} value={cfg[k]} className="input"
                  onChange={(e) => setCfg({ ...cfg, [k]: Math.min(120, Math.max(1, Number(e.target.value) || 1)) })} /></label>
            ))}
          </div>
        )}
      </div>
      {pending && (
        <form onSubmit={save} className="card space-y-3" aria-label="Save study session">
          <p className="font-medium">Save this study session?</p>
          <p className="text-sm text-neutral-500">{Math.round(pending.seconds / 60)} min · {new Date(pending.start).toLocaleTimeString()} – {new Date(pending.end).toLocaleTimeString()}</p>
          <select name="subject_id" aria-label="Subject" className="input"><option value="">No subject</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
          <div className="flex gap-2">
            <button className="btn" disabled={saving}>{saving ? "Saving…" : "Save"}</button>
            <button type="button" onClick={() => setPending(null)} className="rounded-lg border border-neutral-300 px-4 py-2 text-sm dark:border-neutral-700">Discard</button>
          </div>
        </form>
      )}
      {msg && <p role="status" className="text-center text-sm text-neutral-500">{msg}</p>}
    </div>
  );
}
