import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Images, ShieldCheck } from "lucide-react";
import { getSettings } from "@/lib/data";

export const revalidate = 60;
export const metadata: Metadata = { title: "Login", robots: { index: false } };

export default async function LoginChoicePage() {
  const s = await getSettings();
  return (
    <section className="flex min-h-[80vh] items-center pb-20 pt-[calc(var(--top)+56px)]">
      <div className="container-x">
        <div className="mx-auto max-w-3xl text-center">
          <p className="label">Welcome to {s.site_name}</p>
          <h1 className="mt-4 font-display text-5xl leading-[1.02] sm:text-6xl">How would you like to continue?</h1>
        </div>
        <div className="mx-auto mt-12 grid max-w-3xl gap-5 sm:grid-cols-2">
          <Link href="/gallery" className="group flex flex-col rounded-3xl border border-paper-line bg-white p-8 transition hover:-translate-y-1 hover:border-ink hover:shadow-xl">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brass/10 text-brass-dark"><Images className="h-6 w-6" /></span>
            <h2 className="mt-6 font-display text-3xl">Visitor</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-stone">Browse our photographs and videos and send an enquiry. No login or password needed.</p>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold">Continue as visitor <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
          </Link>
          <Link href="/admin/login" className="group flex flex-col rounded-3xl bg-ink p-8 text-paper transition hover:-translate-y-1 hover:shadow-xl">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-brass-light"><ShieldCheck className="h-6 w-6" /></span>
            <h2 className="mt-6 font-display text-3xl">Studio Admin</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-paper/65">For the studio team only. Log in with your mobile number and password to manage the website.</p>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brass-light">Admin login <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
          </Link>
        </div>
      </div>
    </section>
  );
}
