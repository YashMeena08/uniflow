"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isValidTz } from "@/lib/dates";
import type { State } from "@/components/settings/form-shell";

const opt = z.string().trim().max(100).optional().transform((v) => v || null);
const num = (min: number, max: number) => z.coerce.number().int().min(min).max(max);
const optNum = (min: number, max: number) => z.string().optional().transform((v) => (v ? Number(v) : null)).pipe(z.number().int().min(min).max(max).nullable());

async function patch(values: Record<string, unknown>): Promise<State> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "You are signed out." };
  const { error } = await supabase.from("profiles").upsert({ id: user.id, ...values });
  if (error) return { ok: false, message: "Unable to save changes. Please try again." };
  revalidatePath("/", "layout");
  return { ok: true, message: "Settings saved." };
}
const bad: State = { ok: false, message: "Please check the form fields." };

export async function updateProfile(_: State, f: FormData): Promise<State> {
  const r = z.object({ full_name: z.string().trim().min(1).max(100), college: opt, degree: opt, branch: opt, graduation_year: optNum(2000, 2100) }).safeParse(Object.fromEntries(f));
  return r.success ? patch(r.data) : bad;
}
export async function updateStudyPrefs(_: State, f: FormData): Promise<State> {
  const r = z.object({
    pomodoro_focus: num(1, 120), pomodoro_short: num(1, 60), pomodoro_long: num(1, 120),
    daily_study_goal_min: num(15, 1440), timezone: z.string().refine(isValidTz),
  }).safeParse(Object.fromEntries(f));
  return r.success ? patch(r.data) : bad;
}
export async function updateAcademic(_: State, f: FormData): Promise<State> {
  const r = z.object({ attendance_target: num(1, 100), semester: optNum(1, 12) }).safeParse(Object.fromEntries(f));
  return r.success ? patch(r.data) : bad;
}
