"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"login" | "reset">("login");
  const [message, setMessage] = useState<{ kind: "error" | "info"; text: string } | null>(
    params.get("error") === "link" ? { kind: "error", text: "That link is invalid or has expired. Please request a new one." } : null,
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage(null);
    const supabase = getSupabaseBrowser();
    try {
      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/admin/auth/callback` });
        if (error) throw error;
        setMessage({ kind: "info", text: "If this email belongs to an admin, a password reset link is on its way." });
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw new Error(error.message === "Invalid login credentials" ? "Incorrect email or password." : error.message);
      const { data: isAdmin } = await supabase.rpc("is_admin");
      if (!isAdmin) {
        await supabase.auth.signOut();
        throw new Error("This account does not have admin access.");
      }
      const next = params.get("next");
      router.replace(next && next.startsWith("/admin") && next !== "/admin/login" ? next : "/admin");
      router.refresh();
    } catch (err) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "Something went wrong. Please try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-900 text-white"><Lock className="h-5 w-5" /></span>
        <h1 className="mt-5 text-2xl font-semibold text-neutral-900">{mode === "login" ? "Studio admin sign in" : "Reset your password"}</h1>
        <p className="mt-1 text-sm text-neutral-500">{mode === "login" ? "Manage photos, videos and website settings." : "We'll email you a secure link to set a new password."}</p>
      </div>
      <div>
        <label htmlFor="email" className="field-label">Email</label>
        <input id="email" type="email" required autoComplete="username" className="input !py-2.5" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      {mode === "login" && (
        <div>
          <label htmlFor="password" className="field-label">Password</label>
          <div className="relative">
            <input id="password" type={show ? "text" : "password"} required autoComplete="current-password" className="input !py-2.5 pr-10" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-700" aria-label={show ? "Hide password" : "Show password"}>
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}
      {message && <p role="alert" className={message.kind === "error" ? "rounded-lg bg-red-50 p-3 text-sm text-red-700" : "rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700"}>{message.text}</p>}
      <button type="submit" disabled={busy} className="a-btn-primary w-full !py-2.5">
        {busy && <Loader2 className="h-4 w-4 animate-spin" />} {mode === "login" ? "Sign in" : "Send reset link"}
      </button>
      <button type="button" onClick={() => { setMode(mode === "login" ? "reset" : "login"); setMessage(null); }} className="w-full text-center text-sm text-neutral-500 hover:text-neutral-900">
        {mode === "login" ? "Forgot password?" : "Back to sign in"}
      </button>
    </form>
  );
}
