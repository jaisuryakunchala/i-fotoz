"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { ADMIN_LOGIN_EMAIL_BASE } from "@/lib/config";
import { mobileToLoginEmail, normalizeMobile } from "@/lib/utils";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(params.get("error") === "link" ? "That link is invalid or has expired." : null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const digits = normalizeMobile(mobile);
    if (!digits) return setError("Enter a valid 10-digit mobile number.");
    if (!password) return setError("Enter your password.");
    setBusy(true);
    setError(null);
    const supabase = getSupabaseBrowser();
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email: mobileToLoginEmail(digits, ADMIN_LOGIN_EMAIL_BASE), password });
      if (err) {
        if (/invalid login credentials/i.test(err.message)) throw new Error("Incorrect mobile number or password.");
        if (/rate limit|too many/i.test(err.message)) throw new Error("Too many attempts. Please wait a few minutes and try again.");
        throw err;
      }
      const { data: isAdmin } = await supabase.rpc("is_admin");
      if (!isAdmin) {
        await supabase.auth.signOut();
        throw new Error("This account does not have admin access.");
      }
      const next = params.get("next");
      router.replace(next && next.startsWith("/admin") && next !== "/admin/login" ? next : "/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div>
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-900 text-white"><Lock className="h-5 w-5" /></span>
        <h1 className="mt-5 text-2xl font-semibold text-neutral-900">Studio admin login</h1>
        <p className="mt-1 text-sm text-neutral-500">For i Fotoz administrators only. Manage photos, videos and website settings.</p>
      </div>
      <div>
        <label htmlFor="mobile" className="field-label">Mobile number</label>
        <div className="flex rounded-lg border border-neutral-300 bg-white focus-within:border-brass focus-within:ring-2 focus-within:ring-brass/25">
          <span className="flex items-center border-r border-neutral-200 px-3 text-sm text-neutral-500">+91</span>
          <input id="mobile" type="tel" inputMode="numeric" autoComplete="username" maxLength={14} placeholder="98765 43210"
            className="w-full rounded-r-lg px-3 py-2.5 text-sm focus:outline-none" value={mobile} onChange={(e) => { setMobile(e.target.value); setError(null); }} />
        </div>
      </div>
      <div>
        <label htmlFor="password" className="field-label">Password</label>
        <div className="relative">
          <input id="password" type={show ? "text" : "password"} autoComplete="current-password" className="input !py-2.5 pr-10" value={password} onChange={(e) => { setPassword(e.target.value); setError(null); }} />
          <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-700" aria-label={show ? "Hide password" : "Show password"}>
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={busy} className="a-btn-primary w-full !py-2.5">
        {busy && <Loader2 className="h-4 w-4 animate-spin" />} Log in
      </button>
      <p className="text-center text-xs text-neutral-500">Forgot your password? Contact your website developer to reset it.</p>
      <Link href="/" className="flex items-center justify-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900">
        <ArrowLeft className="h-4 w-4" /> Back to website
      </Link>
    </form>
  );
}
