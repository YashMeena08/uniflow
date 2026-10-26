"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const opt = z.string().trim().optional().transform((v) => v || null);
const priority = z.enum(["low", "medium", "high", "urgent"]);
const status = z.enum(["not_started", "in_progress", "submitted", "completed"]);
const schema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  subject_id: opt, deadline: opt, priority,
  submission_link: opt.pipe(z.string().url().nullable()),
});
const refresh = () => { revalidatePath("/assignments"); revalidatePath("/subjects"); };

export async function addAssignment(formData: FormData) {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Unable to create assignment. Please check the form.");
  const supabase = await createClient();
  const { error } = await supabase.from("assignments").insert(parsed.data);
  if (error) throw new Error("Unable to create assignment. Please try again.");
  refresh();
}

export async function setAssignmentStatus(formData: FormData) {
  const id = z.string().uuid().parse(formData.get("id"));
  const s = status.parse(formData.get("status"));
  const supabase = await createClient();
  await supabase.from("assignments").update({ status: s }).eq("id", id);
  refresh();
}

export async function deleteAssignment(id: string) {
  const supabase = await createClient();
  await supabase.from("assignments").delete().eq("id", id);
  refresh();
}
