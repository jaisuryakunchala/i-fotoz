"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, FolderOpen, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { removeFiles } from "@/lib/upload";
import type { Category, Photo } from "@/lib/types";
import { cn, errorMessage, slugify } from "@/lib/utils";
import { EmptyState, LoadingBlock, PageTitle, Spinner, Toggle } from "@/components/admin/ui";
import Modal from "@/components/admin/Modal";
import ImageField from "@/components/admin/ImageField";
import { useToast } from "@/components/admin/Toast";
import { useConfirm } from "@/components/admin/Confirm";
import { useRefreshSite } from "@/components/admin/useRefreshSite";

type Row = Category & { count: number };

export default function CategoriesPage() {
  const db = getSupabaseBrowser();
  const toast = useToast();
  const confirm = useConfirm();
  const refreshSite = useRefreshSite();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [editing, setEditing] = useState<Category | "new" | null>(null);
  const [deleting, setDeleting] = useState<Row | null>(null);
  const [reordering, setReordering] = useState(false);

  const load = useCallback(async () => {
    const [cats, photos] = await Promise.all([
      db.from("categories").select("*").order("sort_order").order("name"),
      db.from("photos").select("category_id").limit(10000),
    ]);
    if (cats.error) toast(cats.error.message, "error");
    const tally: Record<string, number> = {};
    (photos.data ?? []).forEach((p: { category_id: string }) => (tally[p.category_id] = (tally[p.category_id] ?? 0) + 1));
    setRows(((cats.data as Category[]) ?? []).map((c) => ({ ...c, count: tally[c.id] ?? 0 })));
  }, [db, toast]);
  useEffect(() => { load(); }, [load]);

  async function move(index: number, dir: -1 | 1) {
    if (!rows || reordering) return;
    const j = index + dir;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[index], next[j]] = [next[j], next[index]];
    const ordered = next.map((r, i) => ({ ...r, sort_order: i }));
    setRows(ordered);
    setReordering(true);
    const results = await Promise.all(ordered.map((r) => db.from("categories").update({ sort_order: r.sort_order }).eq("id", r.id)));
    setReordering(false);
    if (results.some((r) => r.error)) { toast("Could not save the new order.", "error"); load(); } else refreshSite();
  }

  async function toggleFeatured(r: Row) {
    const { error } = await db.from("categories").update({ is_featured: !r.is_featured }).eq("id", r.id);
    if (error) return toast(error.message, "error");
    setRows((l) => l?.map((x) => (x.id === r.id ? { ...x, is_featured: !r.is_featured } : x)) ?? null);
    toast(r.is_featured ? "Removed from homepage collections." : "Shown in homepage collections.");
    refreshSite();
  }

  async function deleteEmpty(r: Row) {
    const ok = await confirm({ title: `Delete “${r.name}”?`, message: "This category has no photos. It will be removed from the website.", confirmText: "Delete category", danger: true });
    if (!ok) return;
    const { error } = await db.from("categories").delete().eq("id", r.id);
    if (error) return toast(`Could not delete: ${error.message}`, "error");
    await removeFiles(db, [r.cover_path]).catch(() => undefined);
    toast("Category deleted.");
    load();
    refreshSite();
  }

  if (!rows) return <LoadingBlock />;

  return (
    <>
      <PageTitle title="Categories" description="Organise your galleries. Use the arrows to change the order shown on the website."
        actions={<button className="a-btn-primary" onClick={() => setEditing("new")}><Plus className="h-4 w-4" /> New category</button>} />
      {!rows.length ? (
        <EmptyState icon={FolderOpen} title="No categories yet" text="Create categories such as Wedding, Birthday or Outdoor Photography." action={<button className="a-btn-primary" onClick={() => setEditing("new")}><Plus className="h-4 w-4" /> New category</button>} />
      ) : (
        <ul className="a-card divide-y divide-neutral-200">
          {rows.map((r, i) => (
            <li key={r.id} className="flex flex-wrap items-center gap-3 p-3 sm:flex-nowrap sm:gap-4">
              <div className="flex flex-col">
                <button className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-30" onClick={() => move(i, -1)} disabled={i === 0 || reordering} aria-label="Move up"><ArrowUp className="h-4 w-4" /></button>
                <button className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-30" onClick={() => move(i, 1)} disabled={i === rows.length - 1 || reordering} aria-label="Move down"><ArrowDown className="h-4 w-4" /></button>
              </div>
              <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {r.cover_url && <img src={r.cover_url} alt="" className="h-full w-full object-cover" loading="lazy" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{r.name}</p>
                <p className="truncate text-xs text-neutral-500">/gallery/{r.slug} · <Link href={`/admin/photos?category=${r.id}`} className="underline-offset-2 hover:underline">{r.count} photo{r.count === 1 ? "" : "s"}</Link></p>
              </div>
              <div className="flex gap-1.5">
                <button className={cn("a-btn-secondary !px-2.5 !py-1.5 text-xs", r.is_featured && "border-brass/40 bg-brass/5")} onClick={() => toggleFeatured(r)} title="Show in homepage featured collections">
                  <Star className={cn("h-3.5 w-3.5", r.is_featured && "fill-brass text-brass")} /> <span className="hidden sm:inline">{r.is_featured ? "Featured" : "Feature"}</span>
                </button>
                <button className="a-btn-secondary !px-2.5 !py-1.5 text-xs" onClick={() => setEditing(r)}><Pencil className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Edit</span></button>
                <button className="a-btn-secondary !px-2.5 !py-1.5 text-xs text-red-600" onClick={() => (r.count ? setDeleting(r) : deleteEmpty(r))} aria-label={`Delete ${r.name}`}><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && <CategoryForm category={editing === "new" ? null : editing} nextOrder={rows.length} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); refreshSite(); }} />}
      {deleting && <DeleteWithContent row={deleting} others={rows.filter((r) => r.id !== deleting.id)} onClose={() => setDeleting(null)} onDone={() => { setDeleting(null); load(); refreshSite(); }} />}
    </>
  );
}

function CategoryForm({ category, nextOrder, onClose, onSaved }: { category: Category | null; nextOrder: number; onClose: () => void; onSaved: () => void }) {
  const db = getSupabaseBrowser();
  const toast = useToast();
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(category));
  const [description, setDescription] = useState(category?.description ?? "");
  const [featured, setFeatured] = useState(category?.is_featured ?? false);
  const [cover, setCover] = useState<{ url: string | null; path: string | null }>({ url: category?.cover_url ?? null, path: category?.cover_path ?? null });
  const [orphans, setOrphans] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const coverChanged = cover.path !== (category?.cover_path ?? null) || cover.url !== (category?.cover_url ?? null);

  async function save() {
    if (saving) return;
    const s = slugify(slug || name);
    if (!name.trim()) return toast("Please enter a category name.", "error");
    if (!s) return toast("Please enter a valid web address (letters and numbers).", "error");
    setSaving(true);
    const payload = { name: name.trim(), slug: s, description: description.trim(), is_featured: featured, cover_url: cover.url, cover_path: cover.path };
    const { error } = category
      ? await db.from("categories").update(payload).eq("id", category.id)
      : await db.from("categories").insert({ ...payload, sort_order: nextOrder });
    setSaving(false);
    if (error) return toast(error.code === "23505" ? "Another category already uses that web address. Choose a different one." : `Could not save: ${error.message}`, "error");
    await removeFiles(db, [...orphans, coverChanged ? category?.cover_path : null]).catch(() => undefined);
    toast(category ? "Category updated." : "Category created.");
    onSaved();
  }

  async function cancel() {
    await removeFiles(db, [...orphans, coverChanged ? cover.path : null]).catch(() => undefined);
    onClose();
  }

  return (
    <Modal open onClose={cancel} title={category ? "Edit category" : "New category"} size="lg" busy={saving}
      footer={<><button className="a-btn-secondary" onClick={cancel} disabled={saving}>Cancel</button><button className="a-btn-primary" onClick={save} disabled={saving}>{saving && <Spinner />} {category ? "Save changes" : "Create category"}</button></>}>
      <div className="grid gap-5 md:grid-cols-[1fr_260px]">
        <div className="space-y-4">
          <div>
            <label className="field-label">Name *</label>
            <input className="input" value={name} maxLength={80} autoFocus onChange={(e) => { setName(e.target.value); if (!slugTouched) setSlug(slugify(e.target.value)); }} placeholder="e.g. Baby Photography" />
          </div>
          <div>
            <label className="field-label">Web address</label>
            <div className="flex items-center rounded-lg border border-neutral-300 bg-neutral-50 pl-3 text-sm text-neutral-500 focus-within:border-brass focus-within:ring-2 focus-within:ring-brass/25">
              /gallery/<input className="w-full rounded-r-lg bg-white px-2 py-2 text-neutral-900 focus:outline-none" value={slug} onChange={(e) => { setSlugTouched(true); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-")); }} />
            </div>
          </div>
          <div><label className="field-label">Description</label><textarea className="input" rows={4} maxLength={600} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Shown on the category page and in the services list." /></div>
          <Toggle checked={featured} onChange={setFeatured} label="Feature on homepage" description="Show this collection in the homepage’s featured galleries." />
        </div>
        <ImageField label="Cover image" folder="covers" aspect="aspect-[4/3]" maxSide={1600} value={cover.url} hint="If empty, the latest photo is used."
          onUploaded={({ url, path }) => { if (coverChanged && cover.path) setOrphans((o) => [...o, cover.path!]); setCover({ url, path }); }}
          onRemove={() => { if (coverChanged && cover.path) setOrphans((o) => [...o, cover.path!]); setCover({ url: null, path: null }); }} />
      </div>
    </Modal>
  );
}

function DeleteWithContent({ row, others, onClose, onDone }: { row: Row; others: Row[]; onClose: () => void; onDone: () => void }) {
  const db = getSupabaseBrowser();
  const toast = useToast();
  const [mode, setMode] = useState<"move" | "delete">(others.length ? "move" : "delete");
  const [target, setTarget] = useState(others[0]?.id ?? "");
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);

  async function run() {
    if (busy) return;
    setBusy(true);
    try {
      if (mode === "move") {
        const { error } = await db.from("photos").update({ category_id: target }).eq("category_id", row.id);
        if (error) throw error;
      } else {
        const { data, error } = await db.from("photos").select("id, path, thumb_path").eq("category_id", row.id).limit(10000);
        if (error) throw error;
        const list = (data as Pick<Photo, "id" | "path" | "thumb_path">[]) ?? [];
        const del = await db.from("photos").delete().eq("category_id", row.id);
        if (del.error) throw del.error;
        await removeFiles(db, list.flatMap((p) => [p.path, p.thumb_path])).catch((e) => toast(`Some files could not be removed: ${errorMessage(e)}`, "error"));
      }
      const { error } = await db.from("categories").delete().eq("id", row.id);
      if (error) throw error;
      await removeFiles(db, [row.cover_path]).catch(() => undefined);
      toast(mode === "move" ? `Photos moved and “${row.name}” deleted.` : `“${row.name}” and its photos were deleted.`);
      onDone();
    } catch (e) {
      toast(`Could not delete: ${errorMessage(e)}`, "error");
      setBusy(false);
    }
  }

  const disabled = busy || (mode === "move" ? !target : typed.trim() !== row.name);
  return (
    <Modal open onClose={onClose} title={`Delete “${row.name}”`} size="sm" busy={busy}
      footer={<><button className="a-btn-secondary" onClick={onClose} disabled={busy}>Cancel</button><button className="a-btn-danger" onClick={run} disabled={disabled}>{busy && <Spinner />} Delete category</button></>}>
      <p className="text-sm text-neutral-600">This category contains <strong>{row.count} photo{row.count === 1 ? "" : "s"}</strong>. What should happen to them?</p>
      <div className="mt-4 space-y-3">
        {others.length > 0 && (
          <label className={cn("block cursor-pointer rounded-xl border p-3", mode === "move" ? "border-neutral-900" : "border-neutral-200")}>
            <span className="flex items-center gap-2 text-sm font-medium"><input type="radio" checked={mode === "move"} onChange={() => setMode("move")} /> Move the photos to another category</span>
            {mode === "move" && (
              <select className="input mt-2" value={target} onChange={(e) => setTarget(e.target.value)}>
                {others.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            )}
          </label>
        )}
        <label className={cn("block cursor-pointer rounded-xl border p-3", mode === "delete" ? "border-red-500" : "border-neutral-200")}>
          <span className="flex items-center gap-2 text-sm font-medium text-red-700"><input type="radio" checked={mode === "delete"} onChange={() => setMode("delete")} /> Permanently delete all {row.count} photos too</span>
          {mode === "delete" && (
            <div className="mt-2">
              <p className="text-xs text-neutral-500">Type <strong className="text-neutral-900">{row.name}</strong> to confirm. Files are deleted from storage and cannot be recovered.</p>
              <input className="input mt-1.5" value={typed} onChange={(e) => setTyped(e.target.value)} />
            </div>
          )}
        </label>
      </div>
    </Modal>
  );
}
