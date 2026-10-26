"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  subject_id: z.string().uuid(),
  class_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(["present", "absent"]),
});

export async function markAttendance(formData: FormData) {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Unable to save attendance. Please check the date.");
  const supabase = await createClient();
  const { error } = await supabase.from("attendance_records").upsert(parsed.data, { onConflict: "subject_id,class_date" });
  if (error) throw new Error("Unable to save attendance. Please try again.");
  revalidatePath("/attendance"); revalidatePath("/subjects");
}

export async function updateTarget(formData: FormData) {
  const target = z.coerce.number().int().min(1).max(100).parse(formData.get("target"));
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from("profiles").update({ attendance_target: target }).eq("id", user!.id);
  revalidatePath("/attendance");
}
