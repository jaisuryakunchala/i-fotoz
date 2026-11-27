"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckSquare, Eye, EyeOff, FolderInput, Images, Pencil, Search, Square, Star, Trash2, Upload, X } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { removeFiles } from "@/lib/upload";
import type { Category, Photo, Status } from "@/lib/types";
import { cn, errorMessage, formatDate } from "@/lib/utils";
import { EmptyState, LoadingBlock, PageTitle, Spinner, StatusBadge, Toggle } from "@/components/admin/ui";
import Modal from "@/components/admin/Modal";
import { useToast } from "@/components/admin/Toast";
import { useConfirm } from "@/components/admin/Confirm";
import { useRefreshSite } from "@/components/admin/useRefreshSite";
import UploadPanel from "./UploadPanel";

const PAGE = 48;

export default function PhotosManager() {
  const params = useSearchParams();
  const db = getSupabaseBrowser();
  const toast = useToast();
  const confirm = useConfirm();
  const refreshSite = useRefreshSite();

  const [categories, setCategories] = useState<Category[] | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [cat, setCat] = useState(params.get("category") ?? "");
  const [status, setStatus] = useState<"" | Status>((params.get("status") as Status) ?? "");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [uploadOpen, setUploadOpen] = useState(params.get("upload") === "1");
  const [editing, setEditing] = useState<Photo | null>(null);
  const [busy, setBusy] = useState(false);
  const [moveTo, setMoveTo] = useState("");

  useEffect(() => { const t = setTimeout(() => setDebounced(q.trim()), 300); return () => clearTimeout(t); }, [q]);

  useEffect(() => {
    db.from("categories").select("*").order("sort_order").order("name").then(({ data, error }) => {
      if (error) toast(error.message, "error");
      setCategories((data as Category[]) ?? []);
    });
  }, [db, toast]);

  const fetchPage = useCallback(async (from: number) => {
    let query = db.from("photos").select("*", { count: "exact" }).order("created_at", { ascending: false }).range(from, from + PAGE - 1);
    if (cat) query = query.eq("category_id", cat);
    if (status) query = query.eq("status", status);
    const term = debounced.replace(/[,(){}%*"\\:]/g, " ").trim();
    if (term) {
      const ors = [`title.ilike.%${term}%`, `description.ilike.%${term}%`];
      if (!/\s/.test(term)) ors.push(`tags.cs.{${term.toLowerCase()}}`);
      query = query.or(ors.join(","));
    }
    const { data, error, count } = await query;
    if (error) throw error;
    return { rows: (data as Photo[]) ?? [], count: count ?? 0 };
  }, [db, cat, status, debounced]);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const { rows, count } = await fetchPage(0);
      setPhotos(rows);
      setTotal(count);
      setSelected(new Set());
    } catch (e) {
      toast(`Could not load photos: ${errorMessage(e)}`, "error");
    } finally {
      setLoading(false);
    }
  }, [fetchPage, toast]);

  useEffect(() => { reload(); }, [reload]);

  async function loadMore() {
    setLoadingMore(true);
    try {
      const { rows, count } = await fetchPage(photos.length);
      setPhotos((p) => [...p, ...rows.filter((r) => !p.some((x) => x.id === r.id))]);
      setTotal(count);
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setLoadingMore(false);
    }
  }

  const catName = useMemo(() => Object.fromEntries((categories ?? []).map((c) => [c.id, c.name])), [categories]);
  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const allSelected = photos.length > 0 && photos.every((p) => selected.has(p.id));

  async function bulkUpdate(ids: string[], patch: Partial<Photo>, message: string) {
    if (!ids.length || busy) return;
    setBusy(true);
    const { error } = await db.from("photos").update(patch).in("id", ids);
    setBusy(false);
    if (error) return toast(`Update failed: ${error.message}`, "error");
    setPhotos((list) => list.map((p) => (ids.includes(p.id) ? { ...p, ...patch } : p)));
    toast(message);
    refreshSite();
  }

  async function deletePhotos(list: Photo[]) {
    if (!list.length || busy) return;
    const ok = await confirm({
      title: list.length === 1 ? "Delete this photo?" : `Delete ${list.length} photos?`,
      message: <>This permanently removes {list.length === 1 ? "the photo" : "these photos"} from the website and deletes the stored image files. This cannot be undone.</>,
      confirmText: "Delete permanently",
      danger: true,
    });
    if (!ok) return;
    setBusy(true);
    const ids = list.map((p) => p.id);
    const { error } = await db.from("photos").delete().in("id", ids);
    if (error) { setBusy(false); return toast(`Delete failed: ${error.message}`, "error"); }
    try {
      await removeFiles(db, list.flatMap((p) => [p.path, p.thumb_path]));
    } catch (e) {
      toast(`Photos deleted, but some files could not be removed from storage: ${errorMessage(e)}`, "error");
    }
    setBusy(false);
    setPhotos((p) => p.filter((x) => !ids.includes(x.id)));
    setTotal((t) => t - ids.length);
    setSelected(new Set());
    toast(list.length === 1 ? "Photo deleted." : `${list.length} photos deleted.`);
    refreshSite();
  }

  if (!categories) return <LoadingBlock />;
  const selectedList = photos.filter((p) => selected.has(p.id));

  return (
    <>
      <PageTitle title="Photos" description={`${total} photo${total === 1 ? "" : "s"}${cat || status || debounced ? " match your filters" : " in your library"}.`}
        actions={<button className="a-btn-primary" onClick={() => setUploadOpen(true)} disabled={!categories.length}><Upload className="h-4 w-4" /> Upload photos</button>} />

      {!categories.length ? (
        <EmptyState icon={Images} title="Create a category first" text="Every photo belongs to a category. Add one (e.g. Wedding Photography) before uploading." action={<Link href="/admin/categories" className="a-btn-primary">Go to categories</Link>} />
      ) : (
        <>
          <div className="a-card mb-4 flex flex-col gap-3 p-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input className="input pl-9" placeholder="Search by title, description or tag…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search photos" />
              {q && <button onClick={() => setQ("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-700" aria-label="Clear search"><X className="h-4 w-4" /></button>}
            </div>
            <select className="input md:w-56" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Filter by category">
              <option value="">All categories</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select className="input md:w-40" value={status} onChange={(e) => setStatus(e.target.value as "" | Status)} aria-label="Filter by status">
              <option value="">Any status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
            <button className="a-btn-secondary" onClick={() => setSelected(allSelected ? new Set() : new Set(photos.map((p) => p.id)))} disabled={!photos.length}>
              {allSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />} {allSelected ? "Clear" : "Select all"}
            </button>
          </div>

          {selected.size > 0 && (
            <div className="sticky top-14 z-20 mb-4 flex flex-wrap items-center gap-2 rounded-xl bg-neutral-900 p-2.5 pl-4 text-sm text-white shadow-lg lg:top-2">
              <span className="mr-auto font-medium">{selected.size} selected</span>
              <button className="a-btn !bg-white/10 hover:!bg-white/20" disabled={busy} onClick={() => bulkUpdate([...selected], { status: "published" }, "Photos published.")}><Eye className="h-4 w-4" /> Publish</button>
              <button className="a-btn !bg-white/10 hover:!bg-white/20" disabled={busy} onClick={() => bulkUpdate([...selected], { status: "draft" }, "Photos moved to drafts.")}><EyeOff className="h-4 w-4" /> Unpublish</button>
              <div className="flex items-center gap-1">
                <select className="input !w-44 !border-white/20 !bg-white/10 !py-1.5 !text-white" value={moveTo} onChange={(e) => setMoveTo(e.target.value)} aria-label="Move to category">
                  <option value="" className="text-neutral-900">Move to category…</option>
                  {categories.map((c) => <option key={c.id} value={c.id} className="text-neutral-900">{c.name}</option>)}
                </select>
                <button className="a-btn !bg-white/10 hover:!bg-white/20" disabled={!moveTo || busy} onClick={() => { bulkUpdate([...selected], { category_id: moveTo }, `Moved to ${catName[moveTo]}.`); setMoveTo(""); }}><FolderInput className="h-4 w-4" /> Move</button>
              </div>
              <button className="a-btn-danger" disabled={busy} onClick={() => deletePhotos(selectedList)}>{busy ? <Spinner /> : <Trash2 className="h-4 w-4" />} Delete</button>
            </div>
          )}

          {loading ? <LoadingBlock label="Loading photos…" /> : !photos.length ? (
            <EmptyState icon={Images} title={debounced || cat || status ? "No photos match" : "No photos yet"} text={debounced || cat || status ? "Try a different search or filter." : "Upload your first photographs to start building the gallery."}
              action={!(debounced || cat || status) && <button className="a-btn-primary" onClick={() => setUploadOpen(true)}><Upload className="h-4 w-4" /> Upload photos</button>} />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {photos.map((p) => (
                  <div key={p.id} className={cn("group overflow-hidden rounded-xl border bg-white transition", selected.has(p.id) ? "border-neutral-900 ring-2 ring-neutral-900" : "border-neutral-200")}>
                    <div className="relative aspect-square bg-neutral-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.thumb_url} alt={p.title} loading="lazy" className="h-full w-full object-cover" />
                      <button onClick={() => toggle(p.id)} className={cn("absolute left-2 top-2 rounded-md bg-white/90 p-1 shadow transition", selected.has(p.id) ? "opacity-100" : "opacity-100 sm:opacity-0 sm:group-hover:opacity-100")} aria-label={selected.has(p.id) ? "Deselect" : "Select"}>
                        {selected.has(p.id) ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                      </button>
                      {p.is_featured && <span className="absolute right-2 top-2 rounded-full bg-brass p-1 text-white" title="Featured"><Star className="h-3 w-3 fill-current" /></span>}
                      <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                        <button onClick={() => setEditing(p)} className="rounded-md bg-white/95 p-1.5 hover:bg-white" aria-label="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => bulkUpdate([p.id], { status: p.status === "published" ? "draft" : "published" }, p.status === "published" ? "Photo unpublished." : "Photo published.")} className="rounded-md bg-white/95 p-1.5 hover:bg-white" aria-label={p.status === "published" ? "Unpublish" : "Publish"}>
                          {p.status === "published" ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                        <button onClick={() => bulkUpdate([p.id], { is_featured: !p.is_featured }, p.is_featured ? "Removed from featured." : "Added to featured.")} className="rounded-md bg-white/95 p-1.5 hover:bg-white" aria-label="Toggle featured"><Star className={cn("h-3.5 w-3.5", p.is_featured && "fill-brass text-brass")} /></button>
                        <button onClick={() => deletePhotos([p])} className="rounded-md bg-white/95 p-1.5 text-red-600 hover:bg-white" aria-label="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                    <div className="p-2.5">
                      <p className="truncate text-sm font-medium" title={p.title}>{p.title || "Untitled"}</p>
                      <p className="truncate text-xs text-neutral-500">{catName[p.category_id] ?? "—"} · {formatDate(p.created_at, { day: "numeric", month: "short" })}</p>
                      <div className="mt-1.5"><StatusBadge status={p.status} /></div>
                    </div>
                  </div>
                ))}
              </div>
              {photos.length < total && (
                <div className="mt-6 text-center">
                  <button className="a-btn-secondary" onClick={loadMore} disabled={loadingMore}>{loadingMore && <Spinner />} Load more ({total - photos.length} remaining)</button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {uploadOpen && <UploadPanel open onClose={() => setUploadOpen(false)} categories={categories} defaultCategory={cat} onUploaded={() => { reload(); refreshSite(); }} />}
      {editing && <EditPhoto photo={editing} categories={categories} onClose={() => setEditing(null)} onSaved={(p) => { setPhotos((l) => l.map((x) => (x.id === p.id ? p : x))); setEditing(null); refreshSite(); }} onDelete={() => { const p = editing; setEditing(null); deletePhotos([p]); }} />}
    </>
  );
}

function EditPhoto({ photo, categories, onClose, onSaved, onDelete }: { photo: Photo; categories: Category[]; onClose: () => void; onSaved: (p: Photo) => void; onDelete: () => void }) {
  const [form, setForm] = useState({ title: photo.title, description: photo.description, tags: photo.tags.join(", "), category_id: photo.category_id, status: photo.status, is_featured: photo.is_featured });
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  async function save() {
    if (saving) return;
    setSaving(true);
    const patch = { ...form, title: form.title.trim(), description: form.description.trim(), tags: Array.from(new Set(form.tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean))).slice(0, 20) };
    const { data, error } = await getSupabaseBrowser().from("photos").update(patch).eq("id", photo.id).select().single();
    setSaving(false);
    if (error) return toast(`Could not save: ${error.message}`, "error");
    toast("Photo details saved.");
    onSaved(data as Photo);
  }

  return (
    <Modal open onClose={onClose} title="Edit photo" size="lg" busy={saving}
      footer={<>
        <button className="a-btn-secondary mr-auto text-red-600" onClick={onDelete} disabled={saving}><Trash2 className="h-4 w-4" /> Delete</button>
        <button className="a-btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
        <button className="a-btn-primary" onClick={save} disabled={saving}>{saving && <Spinner />} Save changes</button>
      </>}>
      <div className="grid gap-5 md:grid-cols-[240px_1fr]">
        <a href={photo.url} target="_blank" rel="noopener noreferrer" className="block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.thumb_url} alt={photo.title} className="w-full rounded-xl bg-neutral-100 object-cover" />
          <span className="mt-1 block text-center text-xs text-neutral-500">Open full size ↗</span>
        </a>
        <div className="space-y-4">
          <div><label className="field-label">Title</label><input className="input" value={form.title} maxLength={140} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><label className="field-label">Description</label><textarea className="input" rows={3} maxLength={2000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div><label className="field-label">Tags (comma separated)</label><input className="input" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="field-label">Category</label>
              <select className="input" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            </div>
            <div><label className="field-label">Status</label>
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Status })}><option value="published">Published</option><option value="draft">Draft</option></select>
            </div>
          </div>
          <Toggle checked={form.is_featured} onChange={(v) => setForm({ ...form, is_featured: v })} label="Featured photo" description="Show in the Featured Work slideshow on the homepage." />
        </div>
      </div>
    </Modal>
  );
}
