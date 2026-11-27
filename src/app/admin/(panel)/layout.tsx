import { redirect } from "next/navigation";
import Shell from "@/components/admin/Shell";
import { isSupabaseConfigured } from "@/lib/config";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getSettings } from "@/lib/data";
import SignOutButton from "./SignOutButton";
import { loginEmailToMobile } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured) redirect("/admin/login");
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  // Server-side authorization: only users listed in the admins table get in
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-100 p-6 text-center">
        <h1 className="text-2xl font-semibold">Access denied</h1>
        <p className="mt-2 max-w-sm text-sm text-neutral-600">You are signed in as {loginEmailToMobile(user.email) ?? user.email}, but this account is not a studio administrator.</p>
        <div className="mt-6"><SignOutButton /></div>
      </main>
    );
  }
  const settings = await getSettings();
  return <Shell email={loginEmailToMobile(user.email) ? `+91 ${loginEmailToMobile(user.email)}` : user.email ?? ""} siteName={settings.site_name}>{children}</Shell>;
}
