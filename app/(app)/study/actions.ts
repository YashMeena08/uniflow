"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  subject_id: z.string().uuid().nullable(),
  duration_seconds: z.number().int().min(60).max(86400),
  started_at: z.string().datetime(),
  ended_at: z.string().datetime(),
  session_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function saveSession(input: unknown): Promise<{ ok: boolean }> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false };
  const supabase = await createClient();
  const { error } = await supabase.from("study_sessions").insert(parsed.data);
  if (error) return { ok: false };
  revalidatePath("/study"); revalidatePath("/analytics");
  return { ok: true };
}
