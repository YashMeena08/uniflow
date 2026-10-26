"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isValidTz } from "@/lib/dates";

const opt = z.string().trim().max(100).optional().transform((v) => v || null);
const schema = z.object({
  full_name: z.string().trim().min(1).max(100),
  college: opt, degree: opt, branch: opt,
  semester: z.string().optional().transform((v) => (v ? Number(v) : null)).pipe(z.number().int().min(1).max(12).nullable()),
  goals: z.array(z.string().trim().min(1).max(100)).max(10),
  subjects: z.array(z.string().trim().min(1).max(100)).max(20),
  timezone: z.string().refine(isValidTz).catch("UTC"),
});

export async function completeOnboarding(input: unknown): Promise<{ ok: false; message: string }> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Please check your details (name is required)." };
  const { subjects, ...profile } = parsed.data;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "You are signed out." };
  const { error } = await supabase.from("profiles").upsert({ id: user.id, ...profile, onboarded: true });
  if (error) return { ok: false, message: "Unable to save your profile. Please try again." };
  const { data: existing } = await supabase.from("subjects").select("name");
  const have = new Set((existing ?? []).map((s) => s.name.toLowerCase()));
  const fresh = [...new Map(subjects.map((n) => [n.toLowerCase(), n])).values()].filter((n) => !have.has(n.toLowerCase()));
  if (fresh.length) await supabase.from("subjects").insert(fresh.map((name) => ({ name })));
  redirect("/dashboard");
}
