import Link from "next/link";
import type { CategoryWithCount } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function CategoryFilter({ categories, active }: { categories: CategoryWithCount[]; active?: string }) {
  const chip = (isActive: boolean) =>
    cn("shrink-0 rounded-full border px-4 py-2 text-[13px] font-medium transition", isActive ? "border-ink bg-ink text-paper" : "border-paper-line bg-white/50 text-ink-muted hover:border-ink hover:text-ink");
  return (
    <nav aria-label="Photo categories" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-none sm:mx-0 sm:flex-wrap sm:px-0">
      <Link href="/gallery" className={chip(!active)} aria-current={!active ? "page" : undefined}>All Photos</Link>
      {categories.map((c) => (
        <Link key={c.id} href={`/gallery/${c.slug}`} className={chip(active === c.slug)} aria-current={active === c.slug ? "page" : undefined}>
          {c.name} <span className="ml-1 opacity-50">{c.photo_count}</span>
        </Link>
      ))}
    </nav>
  );
}
