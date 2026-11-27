"use client";
import { useRef, useState } from "react";
import { ImagePlus, RefreshCw, Trash2 } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { makePath, processImage, publicUrl, uploadFile, validateFile, type MediaKind } from "@/lib/upload";
import { cn, errorMessage } from "@/lib/utils";
import { ProgressBar } from "./ui";
import { useToast } from "./Toast";

/**
 * Single-image picker that uploads immediately and reports the new {url, path}.
 * The caller decides when to persist and is responsible for deleting the previous file.
 */
export default function ImageField({ label, hint, value, onUploaded, onRemove, folder, kind = "image", maxSide = 2400, aspect = "aspect-video", contain = false }: {
  label: string; hint?: string; value: string | null; onUploaded: (r: { url: string; path: string }) => Promise<void> | void; onRemove?: () => Promise<void> | void;
  folder: string; kind?: MediaKind; maxSide?: number; aspect?: string; contain?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  async function pick(file: File | undefined) {
    if (!file || busy) return;
    const err = validateFile(file, kind);
    if (err) return toast(err, "error");
    setBusy(true);
    setProgress(0);
    try {
      const blob = kind === "icon" ? file : await processImage(file, maxSide);
      const path = makePath(folder, blob);
      await uploadFile(getSupabaseBrowser(), path, blob, setProgress);
      await onUploaded({ url: publicUrl(path), path });
    } catch (e) {
      toast(`Upload failed: ${errorMessage(e)}`, "error");
    } finally {
      setBusy(false);
      setProgress(null);
      if (input.current) input.current.value = "";
    }
  }

  async function remove() {
    if (!onRemove || busy) return;
    setBusy(true);
    try { await onRemove(); } finally { setBusy(false); }
  }

  return (
    <div>
      <span className="field-label">{label}</span>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files[0]); }}
        className={cn("group relative overflow-hidden rounded-xl border border-dashed border-neutral-300 bg-neutral-50", aspect)}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt={label} className={cn("h-full w-full", contain ? "object-contain p-4" : "object-cover")} />
        ) : (
          <button type="button" onClick={() => input.current?.click()} disabled={busy} className="flex h-full w-full flex-col items-center justify-center gap-2 text-sm text-neutral-500 hover:text-neutral-800">
            <ImagePlus className="h-6 w-6" /> Click or drop an image
          </button>
        )}
        {progress !== null && (
          <div className="absolute inset-x-0 bottom-0 bg-white/90 p-3"><ProgressBar value={progress} /><p className="mt-1 text-xs text-neutral-600">Uploading… {Math.round(progress * 100)}%</p></div>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button type="button" className="a-btn-secondary !py-1.5 text-xs" onClick={() => input.current?.click()} disabled={busy}>
          {value ? <><RefreshCw className="h-3.5 w-3.5" /> Replace</> : <><ImagePlus className="h-3.5 w-3.5" /> Upload</>}
        </button>
        {value && onRemove && (
          <button type="button" className="a-btn-secondary !py-1.5 text-xs text-red-600" onClick={remove} disabled={busy}><Trash2 className="h-3.5 w-3.5" /> Remove</button>
        )}
        {hint && <span className="text-xs text-neutral-500">{hint}</span>}
      </div>
      <input ref={input} type="file" accept={kind === "icon" ? "image/png,image/x-icon,image/svg+xml,image/jpeg,image/webp" : "image/jpeg,image/png,image/webp"} className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
    </div>
  );
}
