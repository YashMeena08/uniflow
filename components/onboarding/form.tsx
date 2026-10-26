"use client";
import { useState, useTransition } from "react";
import { completeOnboarding } from "@/app/onboarding/actions";

const GOALS = ["Maintain 85% attendance", "Study 3 hours/day", "Complete DSA", "Prepare for placements"];
const SUBJECTS = ["Data Structures & Algorithms", "Database Management Systems", "Operating Systems", "Computer Networks", "Mathematics"];

export default function OnboardingForm({ defaultName }: { defaultName: string }) {
  const [step, setStep] = useState(1);
  const [p, setP] = useState({ full_name: defaultName, college: "", degree: "", branch: "", semester: "" });
  const [goals, setGoals] = useState<string[]>([]);
  const [customGoal, setCustomGoal] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [customSubjects, setCustomSubjects] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const toggle = (list: string[], set: (v: string[]) => void, v: string) => set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const field = (k: keyof typeof p, label: string, type = "text") => (
    <div><label htmlFor={k} className="mb-1 block text-sm">{label}</label>
      <input id={k} type={type} value={p[k]} onChange={(e) => setP({ ...p, [k]: e.target.value })} className="input" min={type === "number" ? 1 : undefined} max={type === "number" ? 12 : undefined} /></div>
  );
  const checks = (items: string[], list: string[], set: (v: string[]) => void) => items.map((g) => (
    <label key={g} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={list.includes(g)} onChange={() => toggle(list, set, g)} /> {g}</label>
  ));
  function finish() {
    setErr(null);
    start(async () => {
      const res = await completeOnboarding({
        ...p, goals: [...goals, ...(customGoal.trim() ? [customGoal.trim()] : [])],
        subjects: [...subjects, ...customSubjects.split(",").map((s) => s.trim()).filter(Boolean)],
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      if (res && !res.ok) setErr(res.message);
    });
  }
  return (
    <div className="card w-full max-w-md space-y-5">
      <p className="text-sm text-neutral-500">Step {step} of 3</p>
      {step === 1 && (<div className="space-y-3"><h1 className="text-xl font-semibold">Tell us about yourself</h1>
        {field("full_name", "Name")}{field("college", "College")}{field("degree", "Degree")}{field("branch", "Branch")}{field("semester", "Semester", "number")}</div>)}
      {step === 2 && (<div className="space-y-3"><h1 className="text-xl font-semibold">Set your academic goals</h1>
        {checks(GOALS, goals, setGoals)}
        <input value={customGoal} onChange={(e) => setCustomGoal(e.target.value)} placeholder="Add your own goal" aria-label="Custom goal" className="input" maxLength={100} /></div>)}
      {step === 3 && (<div className="space-y-3"><h1 className="text-xl font-semibold">Choose your subjects</h1>
        {checks(SUBJECTS, subjects, setSubjects)}
        <input value={customSubjects} onChange={(e) => setCustomSubjects(e.target.value)} placeholder="Custom subjects, comma separated" aria-label="Custom subjects" className="input" /></div>)}
      {err && <p role="alert" className="text-sm text-red-600">{err}</p>}
      <div className="flex justify-between">
        <button type="button" disabled={step === 1} onClick={() => setStep(step - 1)} className="rounded-lg border border-neutral-300 px-4 py-2 text-sm disabled:opacity-40 dark:border-neutral-700">Back</button>
        {step < 3 ? <button type="button" className="btn" disabled={step === 1 && !p.full_name.trim()} onClick={() => setStep(step + 1)}>Next</button>
          : <button type="button" className="btn" disabled={pending} onClick={finish}>{pending ? "Setting up…" : "Finish"}</button>}
      </div>
    </div>
  );
}
