"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const opt = z.string().trim().optional().transform((v) => v || null);
const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  code: opt, professor: opt,
  credits: z.string().optional().transform((v) => (v ? Number(v) : null)).pipe(z.number().int().min(0).max(30).nullable()),
});
const refresh = () => ["/subjects", "/attendance", "/assignments", "/dashboard"].forEach((p) => revalidatePath(p));

export async function addSubject(formData: FormData) {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Unable to add subject. Please check the form.");
  const supabase = await createClient();
  const { error } = await supabase.from("subjects").insert(parsed.data);
  if (error) throw new Error("Unable to add subject. Please try again.");
  refresh();
}

export async function deleteSubject(id: string) {
  const supabase = await createClient();
  await supabase.from("subjects").delete().eq("id", id);
  refresh();
}

export async function seedDemo() {
  const supabase = await createClient();
  const { data: subs } = await supabase.from("subjects").insert([
    { name: "Data Structures & Algorithms", code: "CS201", credits: 4 },
    { name: "Database Management Systems", code: "CS203", credits: 4 },
    { name: "Operating Systems", code: "CS205", credits: 3 },
    { name: "Computer Networks", code: "CS207", credits: 3 },
    { name: "Software Engineering", code: "CS209", credits: 3 },
  ]).select("id");
  if (!subs) return;
  const day = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
  await supabase.from("assignments").insert([
    { subject_id: subs[1].id, title: "DBMS ER diagram", deadline: day(1), priority: "urgent", status: "in_progress" },
    { subject_id: subs[3].id, title: "CN lab report", deadline: day(3), status: "not_started" },
    { subject_id: subs[0].id, title: "DSA sheet", deadline: day(5), priority: "high", status: "not_started" },
    { subject_id: subs[2].id, title: "OS scheduling worksheet", deadline: day(-2), status: "not_started" },
    { subject_id: subs[4].id, title: "SRS document", deadline: day(-6), status: "completed" },
  ]);
  const pattern = [1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1];
  const recs = subs.flatMap((s, i) => pattern.map((p, d) => ({
    subject_id: s.id, class_date: day(-(d + 1)), status: (i === 3 ? d % 2 === 0 : p) ? "present" : "absent",
  })));
  await supabase.from("attendance_records").insert(recs);
  refresh();
}
