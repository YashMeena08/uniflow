"use client";
import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";
export function applyTheme(t: Theme) {
  localStorage.setItem("theme", t);
  document.documentElement.classList.toggle("dark", t === "dark" || (t === "system" && matchMedia("(prefers-color-scheme: dark)").matches));
}
export default function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>("system");
  useEffect(() => { setTheme((localStorage.getItem("theme") as Theme) || "system"); }, []);
  return (
    <div className="card space-y-3"><h2 className="font-medium">Appearance</h2>
      <div className="flex gap-2" role="group" aria-label="Theme">
        {(["light", "dark", "system"] as const).map((t) => (
          <button key={t} aria-pressed={theme === t} onClick={() => { setTheme(t); applyTheme(t); }}
            className={`rounded-full px-4 py-1 text-sm capitalize ${theme === t ? "bg-indigo-600 text-white" : "border border-neutral-300 dark:border-neutral-700"}`}>{t}</button>
        ))}
      </div></div>
  );
}
