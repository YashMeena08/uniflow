"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  due_date: z.string().optional().transform((v) => (v ? v : null)),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  subject_id: z.string().optional().transform((v) => (v ? v : null)),
});

function refresh() { revalidatePath("/tasks"); revalidatePath("/dashboard"); }

export async function addTask(formData: FormData) {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Unable to create task. Please check the form.");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  const { error } = await supabase.from("tasks").insert({ ...parsed.data, user_id: user.id });
  if (error) throw new Error("Unable to create task. Please try again.");
  refresh();
}

export async function toggleTask(id: string, done: boolean) {
  const supabase = await createClient();
  await supabase.from("tasks").update({ status: done ? "todo" : "completed", completed_at: done ? null : new Date().toISOString() }).eq("id", id);
  refresh();
}

export async function deleteTask(id: string) {
  const supabase = await createClient();
  await supabase.from("tasks").delete().eq("id", id);
  refresh();
}
