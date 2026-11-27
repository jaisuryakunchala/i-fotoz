"use client";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();
  return (
    <button className="a-btn-primary" onClick={async () => { await getSupabaseBrowser().auth.signOut(); router.replace("/admin/login"); router.refresh(); }}>
      Sign out
    </button>
  );
}
