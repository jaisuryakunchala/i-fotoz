"use client";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, Film, Pencil, Play, Plus, Star, Trash2 } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { captureVideoFrame, makePath, processImage, publicUrl, removeFiles, uploadFile, validateFile } from "@/lib/upload";
import type { Status, Video } from "@/lib/types";
import { cn, errorMessage, formatBytes, formatDate, youtubeId, youtubeThumb } from "@/lib/utils";
import { MAX_VIDEO_MB } from "@/lib/config";
import { EmptyState, LoadingBlock, PageTitle, ProgressBar, Spinner, StatusBadge, Toggle } from "@/components/admin/ui";
import Modal from "@/components/admin/Modal";
import ImageField from "@/components/admin/ImageField";
import { useToast } from "@/components/admin/Toast";
import { useConfirm } from "@/components/admin/Confirm";
import { useRefreshSite } from "@/components/admin/useRefreshSite";

const thumbOf = (v: Video) => v.thumbnail_url || (v.source === "youtube" ? youtubeThumb(v.url) : null);

export default function VideosManager() {
  const params = useSearchParams();
  const db = getSupabaseBrowser();
  const toast = useToast();
  const confirm = useConfirm();
  const refreshSite = useRefreshSite();
  const [videos, setVideos] = useState<Video[] | null>(null);
  const [adding, setAdding] = useState(params.get("add") === "1");
  const [editing, setEditing] = useState<Video | null>(null);
  const [preview, setPreview] = useState<Video | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await db.from("videos").select("*").order("created_at", { ascending: false });
    if (error) toast(`Could not load videos: ${error.message}`, "error");
    setVideos((data as Video[]) ?? []);
  }, [db, toast]);
  useEffect(() => { load(); }, [load]);

  async function patch(v: Video, p: Partial<Video>, msg: string) {
    const { error } = await db.from("videos").update(p).eq("id", v.id);
    if (error) return toast(error.message, "error");
    setVideos((l) => l?.map((x) => (x.id === v.id ? { ...x, ...p } : x)) ?? null);
    toast(msg);
    refreshSite();
  }

  async function remove(v: Video) {
    const ok = await confirm({ title: "Delete this video?", message: <>“{v.title}” will be removed from the website{v.path ? " and the video file deleted from storage" : ""}. This cannot be undone.</>, confirmText: "Delete permanently", danger: true });
    if (!ok) return;
    const { error } = await db.from("videos").delete().eq("id", v.id);
    if (error) return toast(`Delete failed: ${error.message}`, "error");
    try { await removeFiles(db, [v.path, v.thumbnail_path]); } catch (e) { toast(`Video deleted, but its files could not be removed: ${errorMessage(e)}`, "error"); }
    setVideos((l) => l?.filter((x) => x.id !== v.id) ?? null);
    toast("Video deleted.");
    refreshSite();
  }

  if (!videos) return <LoadingBlock />;

  return (
    <>
      <PageTitle title="Videos" description="Promotional films, advertisements and event highlights." actions={<button className="a-btn-primary" onClick={() => setAdding(true)}><Plus className="h-4 w-4" /> Add video</button>} />
      {!videos.length ? (
        <EmptyState icon={Film} title="No videos yet" text="Upload an MP4/WebM file or paste a YouTube link." action={<button className="a-btn-primary" onClick={() => setAdding(true)}><Plus className="h-4 w-4" /> Add video</button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {videos.map((v) => (
            <div key={v.id} className="a-card overflow-hidden">
              <button className="group relative block aspect-video w-full bg-neutral-900" onClick={() => setPreview(v)} aria-label={`Preview ${v.title}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {thumbOf(v) && <img src={thumbOf(v)!} alt="" loading="lazy" className="h-full w-full object-cover opacity-90" />}
                <span className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 transition group-hover:scale-110"><Play className="h-5 w-5 translate-x-px fill-current" /></span>
                <span className="absolute left-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white">{v.source === "youtube" ? "YouTube" : "Uploaded"}</span>
                {v.is_featured && <span className="absolute right-2 top-2 rounded-full bg-brass p-1 text-white"><Star className="h-3 w-3 fill-current" /></span>}
              </button>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{v.title}</p>
                  <StatusBadge status={v.status} />
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-neutral-500">{v.description || "No description"}</p>
                <p className="mt-2 text-xs text-neutral-400">Added {formatDate(v.created_at)}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <button className="a-btn-secondary !px-2.5 !py-1.5 text-xs" onClick={() => setEditing(v)}><Pencil className="h-3.5 w-3.5" /> Edit</button>
                  <button className="a-btn-secondary !px-2.5 !py-1.5 text-xs" onClick={() => patch(v, { status: v.status === "published" ? "draft" : "published" }, v.status === "published" ? "Video unpublished." : "Video published.")}>
                    {v.status === "published" ? <><EyeOff className="h-3.5 w-3.5" /> Unpublish</> : <><Eye className="h-3.5 w-3.5" /> Publish</>}
                  </button>
                  <button className="a-btn-secondary !px-2.5 !py-1.5 text-xs" onClick={() => patch(v, { is_featured: !v.is_featured }, v.is_featured ? "Removed from homepage." : "Featured on homepage.")}>
                    <Star className={cn("h-3.5 w-3.5", v.is_featured && "fill-brass text-brass")} /> {v.is_featured ? "Featured" : "Feature"}
                  </button>
                  <button className="a-btn-secondary !px-2.5 !py-1.5 text-xs text-red-600" onClick={() => remove(v)}><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {adding && <AddVideo onClose={() => setAdding(false)} onCreated={(v) => { setVideos((l) => [v, ...(l ?? [])]); setAdding(false); refreshSite(); }} />}
      {editing && <EditVideo video={editing} onClose={() => setEditing(null)} onSaved={(v) => { setVideos((l) => l?.map((x) => (x.id === v.id ? v : x)) ?? null); setEditing(null); refreshSite(); }} />}
      {preview && (
        <Modal open onClose={() => setPreview(null)} title={preview.title} size="lg">
          <div className="aspect-video overflow-hidden rounded-lg bg-black">
            {preview.source === "youtube"
              ? <iframe src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(preview.url)}?autoplay=1`} title={preview.title} allow="autoplay; encrypted-media; fullscreen" allowFullScreen className="h-full w-full" />
              : <video src={preview.url} controls autoPlay className="h-full w-full" />}
          </div>
        </Modal>
      )}
    </>
  );
}

function AddVideo({ onClose, onCreated }: { onClose: () => void; onCreated: (v: Video) => void }) {
  const db = getSupabaseBrowser();
  const toast = useToast();
  const [source, setSource] = useState<"upload" | "youtube">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [thumb, setThumb] = useState<File | null>(null);
  const [yt, setYt] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Status>("published");
  const [featured, setFeatured] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [stage, setStage] = useState("");
  const [saving, setSaving] = useState(false);

  function pickVideo(f: File | undefined) {
    if (!f) return;
    const err = validateFile(f, "video");
    if (err) return toast(err, "error");
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").slice(0, 140));
  }
  function pickThumb(f: File | undefined) {
    if (!f) return;
    const err = validateFile(f, "image");
    if (err) return toast(err, "error");
    setThumb(f);
  }

  async function save() {
    if (saving) return;
    if (!title.trim()) return toast("Please add a title.", "error");
    const ytId = source === "youtube" ? youtubeId(yt) : null;
    if (source === "youtube" && !ytId) return toast("That doesn't look like a valid YouTube link.", "error");
    if (source === "upload" && !file) return toast("Please choose a video file.", "error");

    setSaving(true);
    const uploaded: string[] = [];
    try {
      let thumbPath: string | null = null;
      let thumbBlob: Blob | null = thumb ? await processImage(thumb, 1600) : null;
      if (!thumbBlob && file) { setStage("Creating thumbnail…"); thumbBlob = await captureVideoFrame(file); }
      if (thumbBlob) {
        setStage("Uploading thumbnail…");
        thumbPath = await uploadFile(db, makePath("videos/thumbs", thumbBlob), thumbBlob);
        uploaded.push(thumbPath);
      }
      let url = ytId ?? "";
      let path: string | null = null;
      if (file) {
        setStage("Uploading video…");
        setProgress(0);
        path = await uploadFile(db, makePath("videos", file), file, setProgress);
        uploaded.push(path);
        url = publicUrl(path);
      }
      setStage("Saving…");
      const { data, error } = await db.from("videos").insert({
        title: title.trim(), description: description.trim(), source, url, path,
        thumbnail_url: thumbPath ? publicUrl(thumbPath) : null, thumbnail_path: thumbPath, status, is_featured: featured,
      }).select().single();
      if (error) throw error;
      toast("Video added.");
      onCreated(data as Video);
    } catch (e) {
      await removeFiles(db, uploaded).catch(() => undefined);
      toast(`Could not add video: ${errorMessage(e)}`, "error");
      setSaving(false);
      setProgress(null);
      setStage("");
    }
  }

  return (
    <Modal open onClose={onClose} title="Add video" size="lg" busy={saving}
      footer={<><button className="a-btn-secondary" onClick={onClose} disabled={saving}>Cancel</button><button className="a-btn-primary" onClick={save} disabled={saving}>{saving && <Spinner />} {saving ? stage || "Saving…" : "Add video"}</button></>}>
      <div className="space-y-5">
        <div className="inline-flex rounded-lg bg-neutral-100 p-1">
          {(["upload", "youtube"] as const).map((s) => (
            <button key={s} disabled={saving} onClick={() => setSource(s)} className={cn("rounded-md px-4 py-1.5 text-sm font-medium transition", source === s ? "bg-white shadow-sm" : "text-neutral-500")}>
              {s === "upload" ? "Upload a file" : "YouTube link"}
            </button>
          ))}
        </div>

        {source === "upload" ? (
          <div>
            <label className="field-label">Video file *</label>
            <label onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); pickVideo(e.dataTransfer.files[0]); }}
              className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 px-4 py-8 text-center hover:bg-neutral-50">
              <Film className="h-8 w-8 text-neutral-400" />
              <span className="mt-2 text-sm font-medium">{file ? file.name : "Drag & drop or click to choose a video"}</span>
              <span className="mt-1 text-xs text-neutral-500">{file ? formatBytes(file.size) : `MP4, WebM or MOV · up to ${MAX_VIDEO_MB} MB`}</span>
              <input type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden" disabled={saving} onChange={(e) => pickVideo(e.target.files?.[0])} />
            </label>
            {progress !== null && <div className="mt-3"><ProgressBar value={progress} /><p className="mt-1 text-xs text-neutral-500">Uploading video… {Math.round(progress * 100)}%</p></div>}
          </div>
        ) : (
          <div>
            <label className="field-label">YouTube link *</label>
            <input className="input" value={yt} onChange={(e) => setYt(e.target.value)} placeholder="https://www.youtube.com/watch?v=…" disabled={saving} />
            {youtubeId(yt) && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={youtubeThumb(youtubeId(yt)!)} alt="" className="mt-3 w-48 rounded-lg" />
            )}
          </div>
        )}

        <div>
          <label className="field-label">Thumbnail image {source === "upload" ? "(optional — a frame from the video is used otherwise)" : "(optional — YouTube's thumbnail is used otherwise)"}</label>
          <input type="file" accept="image/jpeg,image/png,image/webp" disabled={saving} onChange={(e) => pickThumb(e.target.files?.[0])} className="block text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-neutral-200" />
        </div>
        <div><label className="field-label">Title *</label><input className="input" value={title} maxLength={140} onChange={(e) => setTitle(e.target.value)} disabled={saving} /></div>
        <div><label className="field-label">Description</label><textarea className="input" rows={3} maxLength={2000} value={description} onChange={(e) => setDescription(e.target.value)} disabled={saving} /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="field-label">Status</label><select className="input" value={status} onChange={(e) => setStatus(e.target.value as Status)} disabled={saving}><option value="published">Publish immediately</option><option value="draft">Save as draft</option></select></div>
          <div className="self-end pb-1"><Toggle checked={featured} onChange={setFeatured} label="Feature on homepage" disabled={saving} /></div>
        </div>
      </div>
    </Modal>
  );
}

function EditVideo({ video, onClose, onSaved }: { video: Video; onClose: () => void; onSaved: (v: Video) => void }) {
  const db = getSupabaseBrowser();
  const toast = useToast();
  const [v, setV] = useState(video);
  const [saving, setSaving] = useState(false);
  // thumbnails uploaded in this dialog that were replaced again before saving
  const [orphans, setOrphans] = useState<string[]>([]);
  const changed = v.thumbnail_path !== video.thumbnail_path;

  async function save() {
    if (saving) return;
    if (!v.title.trim()) return toast("Title is required.", "error");
    setSaving(true);
    const { data, error } = await db.from("videos").update({
      title: v.title.trim(), description: v.description.trim(), status: v.status, is_featured: v.is_featured, thumbnail_url: v.thumbnail_url, thumbnail_path: v.thumbnail_path,
    }).eq("id", v.id).select().single();
    setSaving(false);
    if (error) return toast(`Could not save: ${error.message}`, "error");
    // the previous thumbnail file is no longer used once the new one is saved
    await removeFiles(db, [...orphans, changed ? video.thumbnail_path : null]).catch(() => undefined);
    toast("Video updated.");
    onSaved(data as Video);
  }

  async function discard() {
    // remove thumbnails uploaded in this dialog but never saved
    await removeFiles(db, [...orphans, changed ? v.thumbnail_path : null]).catch(() => undefined);
    onClose();
  }

  return (
    <Modal open onClose={discard} title="Edit video" size="lg" busy={saving}
      footer={<><button className="a-btn-secondary" onClick={discard} disabled={saving}>Cancel</button><button className="a-btn-primary" onClick={save} disabled={saving}>{saving && <Spinner />} Save changes</button></>}>
      <div className="grid gap-5 md:grid-cols-[260px_1fr]">
        <ImageField label="Thumbnail" folder="videos/thumbs" value={thumbOf(v)} maxSide={1600}
          onUploaded={({ url, path }) => {
            if (changed && v.thumbnail_path) setOrphans((o) => [...o, v.thumbnail_path!]);
            setV((x) => ({ ...x, thumbnail_url: url, thumbnail_path: path }));
          }} />
        <div className="space-y-4">
          <div><label className="field-label">Title *</label><input className="input" value={v.title} maxLength={140} onChange={(e) => setV({ ...v, title: e.target.value })} /></div>
          <div><label className="field-label">Description</label><textarea className="input" rows={4} maxLength={2000} value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} /></div>
          <div><label className="field-label">Status</label><select className="input" value={v.status} onChange={(e) => setV({ ...v, status: e.target.value as Status })}><option value="published">Published</option><option value="draft">Draft</option></select></div>
          <Toggle checked={v.is_featured} onChange={(x) => setV({ ...v, is_featured: x })} label="Feature on homepage" />
        </div>
      </div>
    </Modal>
  );
}
