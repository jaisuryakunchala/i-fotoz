import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { CategoryWithCount } from "@/lib/types";
import { cn } from "@/lib/utils";
import Img from "./Img";

export default function CategoryCards({ categories }: { categories: CategoryWithCount[] }) {
  return (
    <div className="grid auto-rows-[260px] gap-4 sm:grid-cols-2 sm:auto-rows-[280px] lg:grid-cols-4">
      {categories.map((c, i) => (
        <Link
          key={c.id}
          href={`/gallery/${c.slug}`}
          className={cn("group relative overflow-hidden rounded-2xl bg-ink", i === 0 && "sm:col-span-2 sm:row-span-2", i === 3 && "lg:col-span-2")}
        >
          <Img src={c.cover_url} alt={c.name} className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105" fallbackClassName="absolute inset-0 h-full w-full !bg-ink-soft" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent transition-opacity duration-500 group-hover:from-black/85" />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 sm:p-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-label text-brass-light">{c.photo_count} {c.photo_count === 1 ? "photo" : "photos"}</p>
              <h3 className={cn("mt-1.5 font-display leading-none text-white", i === 0 ? "text-4xl sm:text-5xl" : "text-3xl")}>{c.name}</h3>
              {i === 0 && c.description && <p className="mt-3 hidden max-w-sm text-sm text-white/70 sm:block">{c.description}</p>}
            </div>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/40 text-white transition duration-500 group-hover:rotate-45 group-hover:border-white group-hover:bg-white group-hover:text-ink">
              <ArrowUpRight className="h-5 w-5" />
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
