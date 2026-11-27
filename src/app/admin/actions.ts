"use server";
import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/config";
import { createSupabaseServer } from "@/lib/supabase/server";

async function assertAdmin() {
  if (!isSupabaseConfigured) throw new Error("Supabase is not configured");
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  if (error || !isAdmin) throw new Error("Not authorized");
}

/** Rebuilds the cached public pages so new or changed content appears immediately. */
export async function refreshPublicSite() {
  await assertAdmin();
  revalidatePath("/", "layout");
  return { ok: true };
}
