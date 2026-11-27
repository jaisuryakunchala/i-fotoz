import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/config";
import { createSupabasePublic } from "@/lib/supabase/server";
import type { Category, CategoryWithCount, Photo, Settings, Video } from "@/lib/types";
import sample from "@/lib/sample-data.json";

export const DEFAULT_SETTINGS: Settings = {
  site_name: "i Fotoz",
  tagline: "Every Frame Tells a Story.",
  logo_url: null,
  logo_path: null,
  favicon_url: null,
  favicon_path: null,
  email: "",
  phone: "",
  phone2: "",
  whatsapp: "",
  address: "",
  map_embed_url: "",
  business_hours: "",
  instagram_url: "",
  facebook_url: "",
  youtube_url: "",
  hero_heading: "Every Frame Tells a Story.",
  hero_description: "",
  hero_image_url: null,
  hero_image_path: null,
  about_heading: "About our studio",
  about_text: "",
  about_image_url: null,
  about_image_path: null,
  photographer_name: "",
  photographer_credentials: "",
  banner_enabled: false,
  banner_text: "",
  banner_link: "",
};

const demo = {
  settings: { ...DEFAULT_SETTINGS, ...(sample.settings as Partial<Settings>) },
  categories: sample.categories as Category[],
  photos: sample.photos as Photo[],
  videos: sample.videos as Video[],
};

function logError(where: string, error: unknown) {
  console.error(`[i Fotoz] ${where}:`, error);
}

export const getSettings = cache(async (): Promise<Settings> => {
  if (!isSupabaseConfigured) return demo.settings;
  const { data, error } = await createSupabasePublic().from("settings").select("*").eq("id", 1).maybeSingle();
  if (error) logError("settings", error);
  return { ...DEFAULT_SETTINGS, ...(data ?? {}) };
});

export const getCategories = cache(async (): Promise<CategoryWithCount[]> => {
  let categories: Category[];
  let counts: Record<string, number> = {};
  let firstPhoto: Record<string, string> = {};

  if (!isSupabaseConfigured) {
    categories = demo.categories;
    for (const p of demo.photos) {
      counts[p.category_id] = (counts[p.category_id] ?? 0) + 1;
      firstPhoto[p.category_id] ??= p.thumb_url;
    }
  } else {
    const db = createSupabasePublic();
    const [cats, photos] = await Promise.all([
      db.from("categories").select("*").order("sort_order").order("name"),
      db.from("photos").select("category_id, thumb_url").eq("status", "published").order("created_at", { ascending: false }).limit(5000),
    ]);
    if (cats.error) logError("categories", cats.error);
    if (photos.error) logError("category counts", photos.error);
    categories = (cats.data as Category[]) ?? [];
    counts = {};
    firstPhoto = {};
    for (const p of (photos.data as { category_id: string; thumb_url: string }[]) ?? []) {
      counts[p.category_id] = (counts[p.category_id] ?? 0) + 1;
      firstPhoto[p.category_id] ??= p.thumb_url;
    }
  }
  // Categories without a cover image fall back to their latest photo
  return categories.map((c) => ({ ...c, cover_url: c.cover_url ?? firstPhoto[c.id] ?? null, photo_count: counts[c.id] ?? 0 }));
});

export async function getCategoryBySlug(slug: string) {
  const all = await getCategories();
  return all.find((c) => c.slug === slug) ?? null;
}

export async function getPhotos(opts: { categoryId?: string; featured?: boolean; limit?: number } = {}): Promise<Photo[]> {
  const limit = opts.limit ?? 500;
  if (!isSupabaseConfigured) {
    return demo.photos
      .filter((p) => (!opts.categoryId || p.category_id === opts.categoryId) && (!opts.featured || p.is_featured))
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, limit);
  }
  let q = createSupabasePublic().from("photos").select("*").eq("status", "published");
  if (opts.categoryId) q = q.eq("category_id", opts.categoryId);
  if (opts.featured) q = q.eq("is_featured", true);
  const { data, error } = await q.order("created_at", { ascending: false }).limit(limit);
  if (error) logError("photos", error);
  return (data as Photo[]) ?? [];
}

export async function getVideos(opts: { featured?: boolean; limit?: number } = {}): Promise<Video[]> {
  const limit = opts.limit ?? 100;
  if (!isSupabaseConfigured) {
    return demo.videos.filter((v) => !opts.featured || v.is_featured).slice(0, limit);
  }
  let q = createSupabasePublic().from("videos").select("*").eq("status", "published");
  if (opts.featured) q = q.eq("is_featured", true);
  const { data, error } = await q.order("created_at", { ascending: false }).limit(limit);
  if (error) logError("videos", error);
  return (data as Video[]) ?? [];
}
