"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ExternalLink, FolderOpen, Images, LayoutDashboard, LogOut, Menu, MessageSquare, Settings, Video, X } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { ToastProvider } from "./Toast";
import { ConfirmProvider } from "./Confirm";

const NAV = [
  { href: "/admin", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/admin/photos", label: "Photos", Icon: Images },
  { href: "/admin/videos", label: "Videos", Icon: Video },
  { href: "/admin/categories", label: "Categories", Icon: FolderOpen },
  { href: "/admin/enquiries", label: "Enquiries", Icon: MessageSquare },
  { href: "/admin/settings", label: "Website Settings", Icon: Settings },
];

export default function Shell({ email, siteName, children }: { email: string; siteName: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  async function signOut() {
    setSigningOut(true);
    await getSupabaseBrowser().auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2.5 border-b border-white/10 px-5">
        <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden="true"><circle cx="16" cy="16" r="13" fill="none" stroke="#B08447" strokeWidth="2.4" /><circle cx="16" cy="16" r="4" fill="#fff" /></svg>
        <div className="leading-tight">
          <p className="font-display text-xl text-white">{siteName}</p>
          <p className="text-[10px] uppercase tracking-widest text-white/40">Studio Admin</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-3" aria-label="Admin">
        {NAV.map(({ href, label, Icon }) => (
          <Link key={href} href={href} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition", active(href) ? "bg-white text-neutral-900" : "text-white/70 hover:bg-white/10 hover:text-white")}>
            <Icon className="h-[18px] w-[18px]" /> {label}
          </Link>
        ))}
        <a href="/" target="_blank" rel="noopener" className="mt-4 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white">
          <ExternalLink className="h-[18px] w-[18px]" /> View website
        </a>
      </nav>
      <div className="border-t border-white/10 p-3">
        <p className="truncate px-3 pb-2 text-xs text-white/40" title={email}>{email}</p>
        <button onClick={signOut} disabled={signingOut} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-50">
          <LogOut className="h-[18px] w-[18px]" /> {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </div>
  );

  return (
    <ToastProvider>
      <ConfirmProvider>
        <div className="min-h-screen bg-neutral-100 font-sans text-neutral-900">
          <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 bg-neutral-950 lg:block">{sidebar}</aside>
          {open && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-black/50 animate-fadeIn" onClick={() => setOpen(false)} />
              <aside className="relative h-full w-72 bg-neutral-950 animate-fadeIn">
                <button onClick={() => setOpen(false)} className="absolute right-3 top-4 rounded-lg p-1.5 text-white/70 hover:bg-white/10" aria-label="Close menu"><X className="h-5 w-5" /></button>
                {sidebar}
              </aside>
            </div>
          )}
          <div className="lg:pl-64">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-neutral-200 bg-white/90 px-4 backdrop-blur lg:hidden">
              <button onClick={() => setOpen(true)} className="rounded-lg p-1.5 hover:bg-neutral-100" aria-label="Open menu"><Menu className="h-5 w-5" /></button>
              <p className="font-display text-xl">{siteName} <span className="font-sans text-xs text-neutral-500">Admin</span></p>
            </header>
            <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{children}</main>
          </div>
        </div>
      </ConfirmProvider>
    </ToastProvider>
  );
}
