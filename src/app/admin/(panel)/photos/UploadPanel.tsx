"use client";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, CloudUpload, Loader2, Trash2, XCircle } from "lucide-react";
import Modal from "@/components/admin/Modal";
import { ProgressBar } from "@/components/admin/ui";
import { useToast } from "@/components/admin/Toast";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { makePath, processPhoto, publicUrl, removeFiles, uploadFile, validateFile } from "@/lib/upload";
import type { Category, Status } from "@/lib/types";
import { cn, errorMessage, formatBytes, titleFromFilename } from "@/lib/utils";
import { MAX_PHOTO_MB } from "@/lib/config";

type Item = { id: string; file: File; preview: string; title: string; progress: number; state: "queued" | "processing" | "uploading" | "done" | "error"; error?: string };

export default function UploadPanel({ open, onClose, categories, defaultCategory, onUploaded }: {
  open: boolean; onClose: () => void; categories: Category[]; defaultCategory?: string; onUploaded: () => void;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [categoryId, setCategoryId] = useState(defaultCategory || categories[0]?.id || "");
  const [status, setStatus] = useState<Status>("published");
  const [tags, setTags] = useState("");
  const [description, setDescription] = useState("");
  const [running, setRunning] = useState(false);
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const toast = useToast();

  useEffect(() => { if (!categoryId && categories[0]) setCategoryId(defaultCategory || categories[0].id); }, [categories, categoryId, defaultCategory]);
  useEffect(() => () => items.forEach((i) => URL.revokeObjectURL(i.preview)), []); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (id: string, patch: Partial<Item>) => setItems((list) => list.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  function addFiles(files: FileList | File[]) {
    const next: Item[] = [];
    const errors: string[] = [];
    Array.from(files).forEach((file) => {
      const err = validateFile(file, "image");
      if (err) return errors.push(err);
      if (items.some((i) => i.file.name === file.name && i.file.size === file.size)) return; // skip accidental duplicates
      next.push({ id: crypto.randomUUID(), file, preview: URL.createObjectURL(file), title: titleFromFilename(file.name), progress: 0, state: "queued" });
    });
    if (errors.length) toast(errors.length === 1 ? errors[0] : `${errors.length} files were skipped (unsupported type or larger than ${MAX_PHOTO_MB} MB).`, "error");
    setItems((list) => [...list, ...next]);
  }

  async function uploadOne(item: Item, db: ReturnType<typeof getSupabaseBrowser>, tagList: string[]) {
    let paths: string[] = [];
    try {
      update(item.id, { state: "processing", progress: 0.02, error: undefined });
      const { full, thumb, width, height } = await processPhoto(item.file);
      update(item.id, { state: "uploading", progress: 0.05 });
      const fullPath = makePath("photos", full);
      const thumbPath = fullPath.replace(/(\.[^.]+)$/, "-thumb$1");
      const totals = full.size + thumb.size;
      let thumbDone = 0;
      await uploadFile(db, thumbPath, thumb, (f) => { thumbDone = f * thumb.size; update(item.id, { progress: 0.05 + (0.9 * thumbDone) / totals }); });
      paths = [thumbPath];
      await uploadFile(db, fullPath, full, (f) => update(item.id, { progress: 0.05 + (0.9 * (thumb.size + f * full.size)) / totals }));
      paths.push(fullPath);
      const { error } = await db.from("photos").insert({
        category_id: categoryId, title: item.title.trim(), description: description.trim(), tags: tagList,
        url: publicUrl(fullPath), path: fullPath, thumb_url: publicUrl(thumbPath), thumb_path: thumbPath, width, height, status,
      });
      if (error) throw error;
      update(item.id, { state: "done", progress: 1 });
      return true;
    } catch (e) {
      if (paths.length) await removeFiles(db, paths).catch(() => undefined); // don't leave orphaned files
      update(item.id, { state: "error", error: errorMessage(e) });
      return false;
    }
  }

  async function start() {
    if (running || !categoryId) return;
    const queue = items.filter((i) => i.state === "queued" || i.state === "error");
    if (!queue.length) return;
    setRunning(true);
    const db = getSupabaseBrowser();
    const tagList = Array.from(new Set(tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean))).slice(0, 20);
    let ok = 0;
    let idx = 0;
    const worker = async () => { while (idx < queue.length) { const it = queue[idx++]; if (await uploadOne(it, db, tagList)) ok++; } };
    await Promise.all([worker(), worker()]);
    setRunning(false);
    const failed = queue.length - ok;
    if (ok) { toast(`${ok} photo${ok === 1 ? "" : "s"} uploaded${status === "published" ? " and published" : " as drafts"}.`); onUploaded(); }
    if (failed) toast(`${failed} photo${failed === 1 ? "" : "s"} failed. Check the list and retry.`, "error");
  }

  function close() {
    if (running) return;
    items.forEach((i) => URL.revokeObjectURL(i.preview));
    setItems([]);
    setDescription("");
    onClose();
  }

  const pending = items.filter((i) => i.state === "queued" || i.state === "error").length;
  const allDone = items.length > 0 && items.every((i) => i.state === "done");

  return (
    <Modal open={open} onClose={close} title="Upload photos" size="xl" busy={running}
      footer={
        <>
          <p className="mr-auto self-center text-xs text-neutral-500">{items.length} selected · images are compressed and thumbnails generated automatically</p>
          <button className="a-btn-secondary" onClick={close} disabled={running}>{allDone ? "Done" : "Cancel"}</button>
          {!allDone && (
            <button className="a-btn-primary" onClick={start} disabled={running || !pending || !categoryId}>
              {running ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</> : <><CloudUpload className="h-4 w-4" /> Upload {pending || ""} photo{pending === 1 ? "" : "s"}</>}
            </button>
          )}
        </>
      }>
      <div className="grid gap-4 md:grid-cols-4">
        <div className="md:col-span-1">
          <label className="field-label">Category *</label>
          <select className="input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} disabled={running}>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label">Visibility</label>
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value as Status)} disabled={running}>
            <option value="published">Publish immediately</option>
            <option value="draft">Save as draft</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="field-label">Tags (comma separated)</label>
          <input className="input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g. bride, outdoor, candid" disabled={running} />
        </div>
        <div className="md:col-span-4">
          <label className="field-label">Description (applies to all photos in this batch, optional)</label>
          <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} disabled={running} />
        </div>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); if (!running) addFiles(e.dataTransfer.files); }}
        onClick={() => !running && input.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && input.current?.click()}
        className={cn("mt-5 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition",
          drag ? "border-brass bg-brass/5" : "border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50")}
      >
        <CloudUpload className="h-9 w-9 text-neutral-400" />
        <p className="mt-3 font-medium text-neutral-800">Drag & drop photos here, or click to browse</p>
        <p className="mt-1 text-xs text-neutral-500">JPG, PNG, WebP or GIF · up to {MAX_PHOTO_MB} MB each · select as many as you like</p>
        <input ref={input} type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }} />
      </div>

      {items.length > 0 && (
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <li key={it.id} className="flex gap-3 rounded-xl border border-neutral-200 p-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.preview} alt="" className="h-20 w-20 shrink-0 rounded-lg bg-neutral-100 object-cover" />
              <div className="min-w-0 flex-1">
                <input className="input !py-1 text-xs" value={it.title} onChange={(e) => update(it.id, { title: e.target.value })} disabled={it.state !== "queued" && it.state !== "error"} aria-label="Photo title" placeholder="Title" maxLength={140} />
                <p className="mt-1 truncate text-[11px] text-neutral-500">{it.file.name} · {formatBytes(it.file.size)}</p>
                <div className="mt-2">
                  {it.state === "queued" ? (
                    <button onClick={() => { URL.revokeObjectURL(it.preview); setItems((l) => l.filter((x) => x.id !== it.id)); }} disabled={running} className="inline-flex items-center gap-1 text-[11px] text-neutral-500 hover:text-red-600"><Trash2 className="h-3 w-3" /> Remove</button>
                  ) : it.state === "done" ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" /> Uploaded</span>
                  ) : it.state === "error" ? (
                    <span className="flex items-start gap-1 text-[11px] text-red-600"><XCircle className="mt-px h-3.5 w-3.5 shrink-0" /> {it.error}</span>
                  ) : (
                    <><ProgressBar value={it.progress} /><p className="mt-1 text-[11px] text-neutral-500">{it.state === "processing" ? "Optimising…" : `Uploading ${Math.round(it.progress * 100)}%`}</p></>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
