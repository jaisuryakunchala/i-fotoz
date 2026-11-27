"use client";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import type { Photo } from "@/lib/types";
import { cn } from "@/lib/utils";
import Lightbox from "./Lightbox";

export default function FeaturedSlideshow({ photos, categories }: { photos: Photo[]; categories: { id: string; name: string }[] }) {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const n = photos.length;
  const go = useCallback((d: number) => setI((x) => (x + d + n) % n), [n]);

  useEffect(() => {
    if (!playing || n < 2 || lightbox !== null) return;
    const t = setTimeout(() => go(1), 5500);
    return () => clearTimeout(t);
  }, [i, playing, n, go, lightbox]);

  if (!n) return null;
  const current = photos[i];
  const catName = (id: string) => categories.find((c) => c.id === id)?.name;

  return (
    <div className="grid items-stretch gap-6 lg:grid-cols-[1fr_340px] lg:gap-10">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-ink sm:aspect-[16/10]">
        {photos.map((p, idx) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setLightbox(idx)}
            className={cn("absolute inset-0 transition-opacity duration-[1200ms]", idx === i ? "opacity-100" : "pointer-events-none opacity-0")}
            aria-label={`Open ${p.title || "photo"} in full screen`}
            tabIndex={idx === i ? 0 : -1}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={Math.abs(idx - i) <= 1 || (i === n - 1 && idx === 0) ? p.url : p.thumb_url} alt={p.title} loading={idx === 0 ? "eager" : "lazy"}
              className={cn("h-full w-full object-cover", idx === i && "animate-kenburns")} />
          </button>
        ))}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
          <div className="flex gap-1.5">
            {photos.map((p, idx) => (
              <button key={p.id} onClick={() => setI(idx)} aria-label={`Go to slide ${idx + 1}`}
                className={cn("h-1 rounded-full transition-all duration-500", idx === i ? "w-8 bg-white" : "w-3 bg-white/40 hover:bg-white/70")} />
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setPlaying((p) => !p)} className="rounded-full bg-black/30 p-2 text-white backdrop-blur hover:bg-black/50" aria-label={playing ? "Pause slideshow" : "Play slideshow"}>
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-between border-t border-paper-line pt-6 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
        <div key={current.id} className="animate-fadeUp">
          <p className="font-display text-6xl leading-none text-brass/40">{String(i + 1).padStart(2, "0")}</p>
          {catName(current.category_id) && <p className="label mt-6">{catName(current.category_id)}</p>}
          <h3 className="mt-3 font-display text-3xl leading-tight sm:text-4xl">{current.title || "Featured frame"}</h3>
          {current.description && <p className="mt-4 text-sm leading-relaxed text-stone">{current.description}</p>}
        </div>
        <div className="mt-8 flex gap-3">
          <button onClick={() => go(-1)} className="flex h-12 w-12 items-center justify-center rounded-full border border-ink/15 transition hover:border-ink hover:bg-ink hover:text-paper" aria-label="Previous slide"><ChevronLeft className="h-5 w-5" /></button>
          <button onClick={() => go(1)} className="flex h-12 w-12 items-center justify-center rounded-full border border-ink/15 transition hover:border-ink hover:bg-ink hover:text-paper" aria-label="Next slide"><ChevronRight className="h-5 w-5" /></button>
        </div>
      </div>

      {lightbox !== null && <Lightbox photos={photos} index={lightbox} onIndex={setLightbox} onClose={() => setLightbox(null)} categoryName={catName} />}
    </div>
  );
}
