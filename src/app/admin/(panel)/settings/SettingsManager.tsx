"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Save } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { removeFiles } from "@/lib/upload";
import type { Category, Settings, Video } from "@/lib/types";
import { DEFAULT_SETTINGS_CLIENT } from "./defaults";
import { cn, digitsOnly, safeMapEmbed } from "@/lib/utils";
import { LoadingBlock, PageTitle, Spinner, Toggle } from "@/components/admin/ui";
import ImageField from "@/components/admin/ImageField";
import { useToast } from "@/components/admin/Toast";
import { useRefreshSite } from "@/components/admin/useRefreshSite";

const TABS = [
  { id: "branding", label: "Branding" },
  { id: "contact", label: "Contact" },
  { id: "social", label: "Social Media" },
  { id: "homepage", label: "Homepage" },
  { id: "banner", label: "Promo Banner" },
  { id: "account", label: "Account" },
] as const;
type Tab = (typeof TABS)[number]["id"];
type ImageKey = "logo" | "favicon" | "hero_image" | "about_image";

export default function SettingsManager() {
  const params = useSearchParams();
  const router = useRouter();
  const db = getSupabaseBrowser();
  const toast = useToast();
  const refreshSite = useRefreshSite();
  const tab = (TABS.find((t) => t.id === params.get("tab"))?.id ?? "branding") as Tab;

  const [saved, setSaved] = useState<Settings | null>(null);
  const [form, setForm] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    db.from("settings").select("*").eq("id", 1).maybeSingle().then(({ data, error }) => {
      if (error) toast(`Could not load settings: ${error.message}`, "error");
      const s = { ...DEFAULT_SETTINGS_CLIENT, ...(data ?? {}) } as Settings;
      setSaved(s);
      setForm(s);
    });
  }, [db, toast]);

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setForm((f) => (f ? { ...f, [k]: v } : f));
  const dirty = Boolean(form && saved && JSON.stringify(form) !== JSON.stringify(saved));

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function validate(f: Settings): string | null {
    if (!f.site_name.trim()) return "Website name cannot be empty.";
    if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) return "Please enter a valid email address.";
    if (f.whatsapp && digitsOnly(f.whatsapp).length < 8) return "WhatsApp number should include the country code, e.g. 919876543210.";
    for (const [k, label] of [["instagram_url", "Instagram"], ["facebook_url", "Facebook"], ["youtube_url", "YouTube"]] as const) {
      if (f[k] && !/^https?:\/\/\S+$/.test(f[k].trim())) return `${label} link must start with https://`;
    }
    if (f.map_embed_url && !safeMapEmbed(f.map_embed_url)) return "Google Maps: paste the embed link (Share → Embed a map → copy HTML).";
    if (f.banner_link && !/^(\/|https?:\/\/)/.test(f.banner_link.trim())) return "Banner link must start with / or https://";
    return null;
  }

  async function save() {
    if (!form || saving) return;
    const err = validate(form);
    if (err) return toast(err, "error");
    setSaving(true);
    const text = { ...form } as Partial<Settings>;
    // images are saved instantly by their own fields
    (["logo", "favicon", "hero_image", "about_image"] as ImageKey[]).forEach((k) => { delete text[`${k}_url` as keyof Settings]; delete text[`${k}_path` as keyof Settings]; });
    Object.keys(text).forEach((k) => { const v = text[k as keyof Settings]; if (typeof v === "string") (text as Record<string, unknown>)[k] = v.trim(); });
    if (text.map_embed_url) text.map_embed_url = safeMapEmbed(text.map_embed_url) ?? "";
    if (text.whatsapp) text.whatsapp = digitsOnly(text.whatsapp);
    const { data, error } = await db.from("settings").update({ ...text, updated_at: new Date().toISOString() }).eq("id", 1).select().single();
    setSaving(false);
    if (error) return toast(`Could not save: ${error.message}`, "error");
    const next = { ...form, ...(data as Settings) };
    setSaved(next);
    setForm(next);
    toast("Settings saved. The website has been updated.");
    refreshSite();
  }

  const saveImage = useCallback(async (key: ImageKey, value: { url: string; path: string } | null) => {
    if (!saved) return;
    const oldPath = saved[`${key}_path` as keyof Settings] as string | null;
    const patch = { [`${key}_url`]: value?.url ?? null, [`${key}_path`]: value?.path ?? null };
    const { error } = await db.from("settings").update(patch).eq("id", 1);
    if (error) {
      if (value) await removeFiles(db, [value.path]).catch(() => undefined);
      return toast(`Could not save image: ${error.message}`, "error");
    }
    await removeFiles(db, [oldPath]).catch(() => undefined); // replaced file is deleted from storage
    setSaved((s) => (s ? { ...s, ...patch } : s));
    setForm((f) => (f ? { ...f, ...patch } : f));
    toast(value ? "Image updated." : "Image removed.");
    refreshSite();
  }, [db, saved, toast, refreshSite]);

  if (!form) return <LoadingBlock />;

  const imageField = (key: ImageKey, label: string, opts: Partial<React.ComponentProps<typeof ImageField>> = {}) => (
    <ImageField label={label} folder="branding" value={form[`${key}_url` as keyof Settings] as string | null}
      onUploaded={(v) => saveImage(key, v)} onRemove={() => saveImage(key, null)} {...opts} />
  );
  const text = (k: keyof Settings, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div><label className="field-label" htmlFor={`f-${k}`}>{label}</label><input id={`f-${k}`} className="input" value={String(form[k] ?? "")} onChange={(e) => set(k, e.target.value as never)} {...props} /></div>
  );
  const area = (k: keyof Settings, label: string, rows = 3, hint?: string) => (
    <div><label className="field-label" htmlFor={`f-${k}`}>{label}</label><textarea id={`f-${k}`} className="input" rows={rows} value={String(form[k] ?? "")} onChange={(e) => set(k, e.target.value as never)} />{hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}</div>
  );

  const showSave = tab !== "account";

  return (
    <>
      <PageTitle title="Website Settings" description="Changes here update the public website instantly — no code needed." />
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-neutral-200 scrollbar-none">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => router.replace(`/admin/settings?tab=${t.id}`, { scroll: false })}
            className={cn("shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition", tab === t.id ? "border-neutral-900 text-neutral-900" : "border-transparent text-neutral-500 hover:text-neutral-800")}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="a-card p-5 sm:p-6">
        {tab === "branding" && (
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-4">
              {text("site_name", "Website name", { maxLength: 60 })}
              {text("tagline", "Tagline", { maxLength: 120 })}
              <p className="text-xs text-neutral-500">The name and tagline appear in the header, footer, browser tab and search results.</p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {imageField("logo", "Studio logo", { kind: "icon", contain: true, aspect: "aspect-[3/2]", maxSide: 800, hint: "PNG with transparent background works best." })}
              {imageField("favicon", "Favicon (browser icon)", { kind: "icon", contain: true, aspect: "aspect-[3/2]", hint: "Square PNG/ICO, 512×512." })}
            </div>
          </div>
        )}

        {tab === "contact" && (
          <div className="grid gap-4 md:grid-cols-2">
            {text("email", "Email address", { type: "email" })}
            {text("phone", "Primary phone number", { type: "tel" })}
            {text("phone2", "Secondary phone number", { type: "tel" })}
            <div>{text("whatsapp", "WhatsApp number", { type: "tel", placeholder: "919876543210" })}<p className="mt-1 text-xs text-neutral-500">Include the country code, digits only (91 for India).</p></div>
            <div className="md:col-span-2">{area("address", "Studio address", 3)}</div>
            <div className="md:col-span-2">{text("business_hours", "Business hours", { placeholder: "Mon – Sat: 9:30 AM – 8:30 PM" })}</div>
            <div className="md:col-span-2">{area("map_embed_url", "Google Maps embed", 3, "In Google Maps: Share → Embed a map → Copy HTML, then paste it here. Leave empty to hide the map.")}</div>
          </div>
        )}

        {tab === "social" && (
          <div className="grid max-w-xl gap-4">
            {text("instagram_url", "Instagram profile URL", { placeholder: "https://instagram.com/yourstudio" })}
            {text("facebook_url", "Facebook page URL", { placeholder: "https://facebook.com/yourstudio" })}
            {text("youtube_url", "YouTube channel URL", { placeholder: "https://youtube.com/@yourstudio" })}
            <p className="text-xs text-neutral-500">Leave a field empty to hide that icon.</p>
          </div>
        )}

        {tab === "homepage" && <HomepageTab form={form} text={text} area={area} imageField={imageField} />}

        {tab === "banner" && (
          <div className="max-w-xl space-y-4">
            <Toggle checked={form.banner_enabled} onChange={(v) => set("banner_enabled", v)} label="Show promotional banner" description="A slim announcement bar at the top of every page." />
            {text("banner_text", "Banner message", { maxLength: 140, placeholder: "Wedding season bookings now open" })}
            {text("banner_link", "Banner link (optional)", { placeholder: "/contact or https://…" })}
            {form.banner_enabled && form.banner_text && <div className="rounded-lg bg-brass px-4 py-2.5 text-center text-sm font-semibold text-white">{form.banner_text}</div>}
          </div>
        )}

        {tab === "account" && <AccountTab />}
      </div>

      {showSave && (
        <div className="sticky bottom-0 z-10 -mx-4 mt-6 flex items-center justify-end gap-3 border-t border-neutral-200 bg-neutral-100/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border sm:bg-white">
          {dirty && <span className="mr-auto text-sm text-amber-700">You have unsaved changes</span>}
          <button className="a-btn-secondary" disabled={!dirty || saving} onClick={() => setForm(saved)}>Discard</button>
          <button className="a-btn-primary" disabled={!dirty || saving} onClick={save}>{saving ? <Spinner /> : <Save className="h-4 w-4" />} Save changes</button>
        </div>
      )}
    </>
  );
}

function HomepageTab({ form, text, area, imageField }: {
  form: Settings;
  text: (k: keyof Settings, label: string, props?: React.InputHTMLAttributes<HTMLInputElement>) => React.ReactNode;
  area: (k: keyof Settings, label: string, rows?: number, hint?: string) => React.ReactNode;
  imageField: (key: ImageKey, label: string, opts?: Record<string, unknown>) => React.ReactNode;
}) {
  const db = getSupabaseBrowser();
  const toast = useToast();
  const refreshSite = useRefreshSite();
  const [cats, setCats] = useState<Category[]>([]);
  const [vids, setVids] = useState<Video[]>([]);

  useEffect(() => {
    db.from("categories").select("*").order("sort_order").then(({ data }) => setCats((data as Category[]) ?? []));
    db.from("videos").select("*").order("created_at", { ascending: false }).then(({ data }) => setVids((data as Video[]) ?? []));
  }, [db]);

  async function feature(table: "categories" | "videos", id: string, value: boolean) {
    const { error } = await db.from(table).update({ is_featured: value }).eq("id", id);
    if (error) return toast(error.message, "error");
    if (table === "categories") setCats((l) => l.map((c) => (c.id === id ? { ...c, is_featured: value } : c)));
    else setVids((l) => l.map((v) => (v.id === id ? { ...v, is_featured: value } : v)));
    refreshSite();
  }

  return (
    <div className="space-y-10">
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <h3 className="font-semibold">Hero section</h3>
          {text("hero_heading", "Hero heading", { maxLength: 120 })}
          {area("hero_description", "Hero description", 3)}
        </div>
        {imageField("hero_image", "Hero background image", { maxSide: 2800, hint: "Landscape photo, at least 1920px wide." })}
      </section>

      <section className="grid gap-6 border-t border-neutral-200 pt-8 lg:grid-cols-2">
        <div className="space-y-4">
          <h3 className="font-semibold">About section</h3>
          {text("about_heading", "About heading", { maxLength: 120 })}
          {area("about_text", "About text", 7, "Leave an empty line between paragraphs.")}
          <div className="grid gap-4 sm:grid-cols-2">
            {text("photographer_name", "Photographer name", { maxLength: 80 })}
            {text("photographer_credentials", "Qualification", { maxLength: 80, placeholder: "BFA · JNTUH" })}
          </div>
        </div>
        {imageField("about_image", "Photographer photo", { aspect: "aspect-[4/5] max-w-xs", maxSide: 1600 })}
      </section>

      <section className="grid gap-8 border-t border-neutral-200 pt-8 lg:grid-cols-2">
        <div>
          <h3 className="font-semibold">Featured gallery collections</h3>
          <p className="mb-3 text-xs text-neutral-500">Shown as large cards on the homepage (up to 6). Saved instantly.</p>
          <ul className="divide-y divide-neutral-100 rounded-lg border border-neutral-200">
            {cats.map((c) => (
              <li key={c.id}><label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm"><input type="checkbox" checked={c.is_featured} onChange={(e) => feature("categories", c.id, e.target.checked)} className="h-4 w-4 accent-neutral-900" /> {c.name}</label></li>
            ))}
            {!cats.length && <li className="px-3 py-2.5 text-sm text-neutral-500">No categories yet.</li>}
          </ul>
        </div>
        <div>
          <h3 className="font-semibold">Featured videos</h3>
          <p className="mb-3 text-xs text-neutral-500">Shown in the homepage video section. Saved instantly.</p>
          <ul className="divide-y divide-neutral-100 rounded-lg border border-neutral-200">
            {vids.map((v) => (
              <li key={v.id}><label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm"><input type="checkbox" checked={v.is_featured} onChange={(e) => feature("videos", v.id, e.target.checked)} className="h-4 w-4 accent-neutral-900" /> {v.title} {v.status === "draft" && <span className="text-xs text-amber-700">(draft)</span>}</label></li>
            ))}
            {!vids.length && <li className="px-3 py-2.5 text-sm text-neutral-500">No videos yet.</li>}
          </ul>
        </div>
      </section>
    </div>
  );
}

function AccountTab() {
  const toast = useToast();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);

  async function change(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (pw.length < 8) return toast("Use at least 8 characters.", "error");
    if (pw !== pw2) return toast("The passwords do not match.", "error");
    setBusy(true);
    const { error } = await getSupabaseBrowser().auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return toast(error.message, "error");
    setPw(""); setPw2("");
    toast("Password changed.");
  }

  return (
    <form onSubmit={change} className="max-w-sm space-y-4">
      <h3 className="font-semibold">Change admin password</h3>
      <div><label className="field-label">New password</label><input type="password" className="input" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
      <div><label className="field-label">Confirm new password</label><input type="password" className="input" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} /></div>
      <button className="a-btn-primary" disabled={busy}>{busy && <Spinner />} Update password</button>
    </form>
  );
}
