import { Suspense } from "react";
import LoginForm from "./LoginForm";
import { isSupabaseConfigured } from "@/lib/config";

export const metadata = { title: "Admin login" };

export default function LoginPage() {
  return (
    <main className="grid min-h-screen bg-neutral-950 lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="https://images.unsplash.com/photo-1452587925148-ce544e77e70d?auto=format&fit=crop&w=1600&q=80" alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/30 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12">
          <p className="font-display text-6xl text-white">i Fotoz</p>
          <p className="mt-2 font-display text-2xl italic text-white/70">Every Frame Tells a Story.</p>
        </div>
      </div>
      <div className="flex items-center justify-center bg-white p-6">
        <div className="w-full max-w-sm">
          {isSupabaseConfigured ? (
            <Suspense><LoginForm /></Suspense>
          ) : (
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900">Connect your database</h1>
              <p className="mt-2 text-sm text-neutral-600">The website is running on sample content. To enable the admin dashboard:</p>
              <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm text-neutral-700">
                <li>Create a free project at supabase.com.</li>
                <li>Run <code className="rounded bg-neutral-100 px-1">supabase/schema.sql</code> (and optionally <code className="rounded bg-neutral-100 px-1">seed.sql</code>) in the SQL editor.</li>
                <li>Add <code className="rounded bg-neutral-100 px-1">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="rounded bg-neutral-100 px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to your environment.</li>
                <li>Create the owner&apos;s login and make it an admin (see README).</li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
