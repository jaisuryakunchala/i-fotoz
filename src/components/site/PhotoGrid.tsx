"use client";
import { useState } from "react";
import { Expand } from "lucide-react";
import type { Photo } from "@/lib/types";
import Img from "./Img";
import Lightbox from "./Lightbox";

type Props = { photos: Photo[]; categories?: { id: string; name: string }[]; pageSize?: number; columns?: "3" | "4" };

/** Masonry gallery with lazy loading, incremental "load more" and full-screen preview. */
export default function PhotoGrid({ photos, categories = [], pageSize = 24, columns = "3" }: Props) {
  const [open, setOpen] = useState<number | null>(null);
  const [visible, setVisible] = useState(pageSize);
  const catName = (id: string) => categories.find((c) => c.id === id)?.name;

  if (!photos.length) {
    return (
      <div className="rounded-2xl border border-dashed border-paper-line px-6 py-20 text-center">
        <p className="font-display text-3xl text-ink">New photographs coming soon</p>
        <p className="mt-2 text-sm text-stone">This collection is being curated. Please check back shortly.</p>
      </div>
    );
  }

  return (
    <>
      <div className={columns === "4" ? "columns-2 gap-3 sm:gap-4 md:columns-3 xl:columns-4" : "columns-1 gap-4 sm:columns-2 lg:columns-3"}>
        {photos.slice(0, visible).map((p, i) => (
          <figure key={p.id} className="group relative mb-3 break-inside-avoid overflow-hidden rounded-xl bg-paper-warm sm:mb-4">
            <button type="button" onClick={() => setOpen(i)} className="block w-full text-left" aria-label={`View ${p.title || "photo"} in full screen`}>
              <Img
                src={p.thumb_url}
                alt={p.title || "Photograph by i Fotoz"}
                width={p.width ?? undefined}
                height={p.height ?? undefined}
                style={p.width && p.height ? { aspectRatio: `${p.width} / ${p.height}` } : undefined}
                className="h-auto w-full transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]"
                fallbackClassName="aspect-[4/5] w-full"
              />
              <figcaption className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-black/10 to-transparent p-4 opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100">
                <span className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-ink">
                  <Expand className="h-4 w-4" />
                </span>
                {catName(p.category_id) && <span className="text-[10px] font-semibold uppercase tracking-label text-brass-light">{catName(p.category_id)}</span>}
                {p.title && <span className="mt-1 font-display text-xl leading-tight text-white">{p.title}</span>}
              </figcaption>
            </button>
          </figure>
        ))}
      </div>

      {visible < photos.length && (
        <div className="mt-10 text-center">
          <button type="button" onClick={() => setVisible((v) => v + pageSize)} className="btn-outline">
            Load more photos <span className="text-stone">({photos.length - visible} more)</span>
          </button>
        </div>
      )}

      {open !== null && <Lightbox photos={photos} index={open} onIndex={setOpen} onClose={() => setOpen(null)} categoryName={catName} />}
    </>
  );
}
