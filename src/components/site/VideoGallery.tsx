"use client";
import { useEffect, useState } from "react";
import { Play, X } from "lucide-react";
import type { Video } from "@/lib/types";
import { cn, youtubeThumb } from "@/lib/utils";
import Img from "./Img";

function thumbOf(v: Video) {
  return v.thumbnail_url || (v.source === "youtube" ? youtubeThumb(v.url) : null);
}

export default function VideoGallery({ videos, dark = false }: { videos: Video[]; dark?: boolean }) {
  const [active, setActive] = useState<Video | null>(null);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setActive(null);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [active]);

  if (!videos.length) {
    return <p className={cn("rounded-2xl border border-dashed px-6 py-16 text-center", dark ? "border-white/15 text-paper/60" : "border-paper-line text-stone")}>Videos will appear here soon.</p>;
  }

  const [first, ...rest] = videos;
  const Card = ({ v, big = false }: { v: Video; big?: boolean }) => (
    <button type="button" onClick={() => setActive(v)} className="group block w-full text-left" aria-label={`Play video: ${v.title}`}>
      <div className={cn("relative overflow-hidden rounded-2xl bg-ink-soft", big ? "aspect-video" : "aspect-video")}>
        <Img src={thumbOf(v)} alt={v.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" fallbackClassName="h-full w-full !bg-ink-soft" />
        <div className="absolute inset-0 bg-black/25 transition group-hover:bg-black/40" />
        <span className={cn("absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-ink shadow-xl transition duration-500 group-hover:scale-110 group-hover:bg-brass group-hover:text-white", big ? "h-20 w-20" : "h-14 w-14")}>
          <Play className={cn("translate-x-0.5 fill-current", big ? "h-7 w-7" : "h-5 w-5")} />
        </span>
      </div>
      <h3 className={cn("mt-4 font-display leading-tight", big ? "text-3xl" : "text-2xl", dark ? "text-paper" : "text-ink")}>{v.title}</h3>
      {v.description && <p className={cn("mt-1.5 line-clamp-2 text-sm", dark ? "text-paper/60" : "text-stone")}>{v.description}</p>}
    </button>
  );

  return (
    <>
      <div className={cn("grid gap-8", rest.length ? "lg:grid-cols-[1.6fr_1fr]" : "")}>
        <Card v={first} big />
        {rest.length > 0 && (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-1">
            {rest.slice(0, 2).map((v) => <Card key={v.id} v={v} />)}
          </div>
        )}
      </div>
      {rest.length > 2 && (
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {rest.slice(2).map((v) => <Card key={v.id} v={v} />)}
        </div>
      )}

      {active && (
        <div role="dialog" aria-modal="true" aria-label={active.title} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-3 animate-fadeIn sm:p-8" onClick={() => setActive(null)}>
          <button onClick={() => setActive(null)} className="absolute right-3 top-3 rounded-full p-2.5 text-white/75 hover:bg-white/10 hover:text-white" aria-label="Close video"><X className="h-6 w-6" /></button>
          <div className="w-full max-w-5xl animate-zoomIn" onClick={(e) => e.stopPropagation()}>
            <div className="aspect-video overflow-hidden rounded-xl bg-black">
              {active.source === "youtube" ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(active.url)}?autoplay=1&rel=0`}
                  title={active.title}
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                  className="h-full w-full"
                />
              ) : (
                <video src={active.url} poster={thumbOf(active) ?? undefined} controls autoPlay playsInline className="h-full w-full" />
              )}
            </div>
            <h3 className="mt-4 font-display text-2xl text-white">{active.title}</h3>
            {active.description && <p className="mt-1 text-sm text-white/60">{active.description}</p>}
          </div>
        </div>
      )}
    </>
  );
}
