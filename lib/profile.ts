import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export const getProfile = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return data;
});
export async function getTimezone(): Promise<string> {
  return (await getProfile())?.timezone ?? "UTC";
}
