"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Eye, FileClock, FolderOpen, Globe, Images, MessageSquare, Upload, Video } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { LoadingBlock, PageTitle, StatusBadge } from "@/components/admin/ui";
import type { Photo } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

type Stats = {
  photos: number; videos: number; categories: number; published: number; drafts: number; unread: number;
  visits: { day: string; views: number }[];
  perCategory: { name: string; count: number }[];
  recent: (Photo & { categories: { name: string } | null })[];
};

export default function DashboardPage() {
  const [s, setS] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const db = getSupabaseBrowser();
    const count = async (table: string, f?: (q: any) => any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      let q = db.from(table).select("id", { count: "exact", head: true });
      if (f) q = f(q);
      const { count: c, error: e } = await q;
      if (e) throw e;
      return c ?? 0;
    };
    (async () => {
      try {
        const [photos, videos, categories, pubP, pubV, unread, visits, cats, catPhotos, recent] = await Promise.all([
          count("photos"), count("videos"), count("categories"),
          count("photos", (q) => q.eq("status", "published")), count("videos", (q) => q.eq("status", "published")),
          count("enquiries", (q) => q.eq("is_read", false)),
          db.rpc("page_view_stats", { days: 14 }),
          db.from("categories").select("id, name").order("sort_order"),
          db.from("photos").select("category_id").limit(10000),
          db.from("photos").select("*, categories(name)").order("created_at", { ascending: false }).limit(8),
        ]);
        const tally: Record<string, number> = {};
        (catPhotos.data ?? []).forEach((p: { category_id: string }) => (tally[p.category_id] = (tally[p.category_id] ?? 0) + 1));
        setS({
          photos, videos, categories, published: pubP + pubV, drafts: photos + videos - pubP - pubV, unread,
          visits: (visits.data as { day: string; views: number }[]) ?? [],
          perCategory: ((cats.data as { id: string; name: string }[]) ?? []).map((c) => ({ name: c.name, count: tally[c.id] ?? 0 })),
          recent: (recent.data as Stats["recent"]) ?? [],
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load the dashboard.");
      }
    })();
  }, []);

  if (error) return <p className="a-card p-6 text-sm text-red-600">{error}</p>;
  if (!s) return <LoadingBlock label="Loading dashboard…" />;

  const cards = [
    { label: "Photographs", value: s.photos, Icon: Images, href: "/admin/photos" },
    { label: "Videos", value: s.videos, Icon: Video, href: "/admin/videos" },
    { label: "Categories", value: s.categories, Icon: FolderOpen, href: "/admin/categories" },
    { label: "Published", value: s.published, Icon: Globe, href: "/admin/photos?status=published" },
    { label: "Drafts", value: s.drafts, Icon: FileClock, href: "/admin/photos?status=draft" },
    { label: "New enquiries", value: s.unread, Icon: MessageSquare, href: "/admin/enquiries", highlight: s.unread > 0 },
  ];
  const totalVisits = s.visits.reduce((n, v) => n + Number(v.views), 0);
  const maxVisit = Math.max(1, ...s.visits.map((v) => Number(v.views)));
  const maxCat = Math.max(1, ...s.perCategory.map((c) => c.count));

  return (
    <>
      <PageTitle title="Dashboard" description="An overview of your studio website." actions={
        <>
          <Link href="/admin/photos?upload=1" className="a-btn-primary"><Upload className="h-4 w-4" /> Upload photos</Link>
          <Link href="/admin/videos?add=1" className="a-btn-secondary"><Video className="h-4 w-4" /> Add video</Link>
        </>
      } />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {cards.map(({ label, value, Icon, href, highlight }) => (
          <Link key={label} href={href} className={cn("a-card p-4 transition hover:border-neutral-300 hover:shadow-sm", highlight && "border-brass/50 bg-brass/5")}>
            <Icon className="h-5 w-5 text-neutral-400" />
            <p className="mt-3 text-2xl font-semibold tabular-nums">{value}</p>
            <p className="text-xs text-neutral-500">{label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="a-card p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="font-semibold">Website visits</h2>
            <p className="flex items-center gap-1.5 text-sm text-neutral-500"><Eye className="h-4 w-4" /> {totalVisits} in the last 14 days</p>
          </div>
          <div className="mt-6 flex h-44 items-end gap-[2px]" role="img" aria-label={`Daily page views for the last 14 days, ${totalVisits} in total`}>
            {s.visits.map((v) => {
              const n = Number(v.views);
              return (
                <div key={v.day} className="group relative flex h-full flex-1 items-end">
                  <div className="w-full rounded-t-[4px] bg-neutral-800 transition group-hover:bg-brass" style={{ height: `${Math.max(n ? 3 : 1, (n / maxVisit) * 100)}%`, opacity: n ? 1 : 0.15 }} />
                  <span className="pointer-events-none absolute -top-8 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-neutral-900 px-2 py-1 text-xs text-white group-hover:block">
                    {formatDate(v.day, { day: "numeric", month: "short" })}: {n} views
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex justify-between border-t border-neutral-200 pt-2 text-[11px] text-neutral-500">
            {s.visits.length > 0 && <><span>{formatDate(s.visits[0].day, { day: "numeric", month: "short" })}</span><span>Today</span></>}
          </div>
        </section>

        <section className="a-card p-5">
          <h2 className="font-semibold">Photos by category</h2>
          <ul className="mt-5 space-y-3">
            {s.perCategory.map((c) => (
              <li key={c.name} className="grid grid-cols-[minmax(0,130px)_1fr_32px] items-center gap-3 text-sm">
                <span className="truncate text-neutral-600" title={c.name}>{c.name}</span>
                <span className="h-2.5 rounded-full bg-neutral-100"><span className="block h-full rounded-full bg-neutral-800" style={{ width: `${(c.count / maxCat) * 100}%` }} /></span>
                <span className="text-right tabular-nums text-neutral-900">{c.count}</span>
              </li>
            ))}
            {!s.perCategory.length && <li className="text-sm text-neutral-500">No categories yet.</li>}
          </ul>
        </section>
      </div>

      <section className="a-card mt-6 p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Recent uploads</h2>
          <Link href="/admin/photos" className="text-sm text-neutral-500 hover:text-neutral-900">View all</Link>
        </div>
        {s.recent.length ? (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
            {s.recent.map((p) => (
              <div key={p.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.thumb_url} alt={p.title} loading="lazy" className="aspect-square w-full rounded-lg bg-neutral-100 object-cover" />
                <p className="mt-1.5 truncate text-xs font-medium">{p.title || "Untitled"}</p>
                <div className="mt-0.5 flex items-center justify-between gap-1"><span className="truncate text-[11px] text-neutral-500">{p.categories?.name}</span><StatusBadge status={p.status} /></div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-neutral-500">No photos yet. <Link href="/admin/photos?upload=1" className="underline">Upload your first photos</Link>.</p>
        )}
      </section>
    </>
  );
}
