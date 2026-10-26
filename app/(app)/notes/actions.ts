"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const idSchema = z.string().uuid();
const updateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().max(50000),
  subject_id: z.string().uuid().nullable(),
  tags: z.array(z.string().trim().min(1).max(30)).max(10),
});

export async function createNote() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("notes").insert({ title: "Untitled note" }).select("id").single();
  if (error || !data) throw new Error("Unable to create note. Please try again.");
  redirect(`/notes/${data.id}`);
}

export async function updateNote(id: string, input: unknown): Promise<{ ok: boolean }> {
  const parsedId = idSchema.safeParse(id);
  const parsed = updateSchema.safeParse(input);
  if (!parsedId.success || !parsed.success) return { ok: false };
  const supabase = await createClient();
  const { error } = await supabase.from("notes").update({ ...parsed.data, updated_at: new Date().toISOString() }).eq("id", parsedId.data);
  if (error) return { ok: false };
  revalidatePath("/notes");
  return { ok: true };
}

export async function toggleFavorite(id: string, fav: boolean) {
  const supabase = await createClient();
  await supabase.from("notes").update({ is_favorite: !fav }).eq("id", idSchema.parse(id));
  revalidatePath("/notes");
}

export async function deleteNote(id: string) {
  const supabase = await createClient();
  await supabase.from("notes").delete().eq("id", idSchema.parse(id));
  revalidatePath("/notes");
  redirect("/notes");
}
