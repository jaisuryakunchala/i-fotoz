"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize, Minimize, Pause, Play, X } from "lucide-react";
import type { Photo } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = { photos: Photo[]; index: number; onClose: () => void; onIndex: (i: number) => void; categoryName?: (id: string) => string | undefined };

export default function Lightbox({ photos, index, onClose, onIndex, categoryName }: Props) {
  const [playing, setPlaying] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [isFull, setIsFull] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const photo = photos[index];
  const count = photos.length;

  const go = useCallback((dir: 1 | -1) => onIndex((index + dir + count) % count), [index, count, onIndex]);

  useEffect(() => setLoaded(false), [index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === " ") { e.preventDefault(); setPlaying((p) => !p); }
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    rootRef.current?.focus();
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prevOverflow; };
  }, [go, onClose]);

  useEffect(() => {
    if (!playing || count < 2) return;
    const t = setTimeout(() => go(1), 4000);
    return () => clearTimeout(t);
  }, [playing, index, go, count]);

  // Preload neighbours for instant navigation
  useEffect(() => {
    [photos[(index + 1) % count], photos[(index - 1 + count) % count]].forEach((p) => { if (p) { const im = new Image(); im.src = p.url; } });
  }, [index, photos, count]);

  useEffect(() => {
    const onFs = () => setIsFull(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else rootRef.current?.requestFullscreen?.().catch(() => undefined);
  };

  if (!photo) return null;
  const cat = categoryName?.(photo.category_id);

  return (
    <div
      ref={rootRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={photo.title || "Photo preview"}
      className="fixed inset-0 z-[60] flex flex-col bg-[#0b0b0a]/[.97] text-white outline-none animate-fadeIn"
      onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
      onTouchEnd={(e) => {
        if (!touch.current) return;
        const dx = e.changedTouches[0].clientX - touch.current.x;
        const dy = e.changedTouches[0].clientY - touch.current.y;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
        else if (dy > 90) onClose();
        touch.current = null;
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        <span className="text-xs tabular-nums tracking-widest text-white/60">{index + 1} / {count}</span>
        <div className="flex items-center gap-1">
          {count > 1 && (
            <button onClick={() => setPlaying((p) => !p)} className="rounded-full p-2.5 text-white/75 transition hover:bg-white/10 hover:text-white" aria-label={playing ? "Pause slideshow" : "Play slideshow"}>
              {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>
          )}
          <button onClick={toggleFullscreen} className="hidden rounded-full p-2.5 text-white/75 transition hover:bg-white/10 hover:text-white sm:block" aria-label="Toggle full screen">
            {isFull ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
          </button>
          <button onClick={onClose} className="rounded-full p-2.5 text-white/75 transition hover:bg-white/10 hover:text-white" aria-label="Close preview">
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-20" onClick={(e) => e.target === e.currentTarget && onClose()}>
        {!loaded && <div className="absolute h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={photo.id}
          src={photo.url}
          alt={photo.title || "Photograph"}
          onLoad={() => setLoaded(true)}
          className={cn("max-h-full max-w-full select-none object-contain transition duration-500", loaded ? "scale-100 opacity-100" : "scale-[.98] opacity-0")}
          draggable={false}
        />
        {count > 1 && (
          <>
            <button onClick={() => go(-1)} className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full border border-white/15 bg-black/30 p-3 text-white/80 backdrop-blur transition hover:bg-white hover:text-ink sm:left-6 sm:block" aria-label="Previous photo">
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button onClick={() => go(1)} className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full border border-white/15 bg-black/30 p-3 text-white/80 backdrop-blur transition hover:bg-white hover:text-ink sm:right-6 sm:block" aria-label="Next photo">
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
      </div>

      <div className="px-4 pb-5 pt-4 text-center sm:px-6">
        {cat && <p className="label mb-1.5">{cat}</p>}
        {photo.title && <h2 className="font-display text-2xl sm:text-3xl">{photo.title}</h2>}
        {photo.description && <p className="mx-auto mt-1.5 max-w-2xl text-sm text-white/60">{photo.description}</p>}
        {count > 1 && (
          <div className="mt-4 flex justify-center gap-6 sm:hidden">
            <button onClick={() => go(-1)} className="rounded-full border border-white/20 p-3" aria-label="Previous photo"><ChevronLeft className="h-5 w-5" /></button>
            <button onClick={() => go(1)} className="rounded-full border border-white/20 p-3" aria-label="Next photo"><ChevronRight className="h-5 w-5" /></button>
          </div>
        )}
      </div>
    </div>
  );
}
