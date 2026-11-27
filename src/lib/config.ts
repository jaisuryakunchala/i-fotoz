export const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** True when real Supabase credentials are present. Without them the public site runs on sample content. */
export const isSupabaseConfigured =
  SUPABASE_URL.startsWith("http") && SUPABASE_ANON_KEY.length > 20 && !SUPABASE_URL.includes("YOUR-PROJECT");

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export const MEDIA_BUCKET = "media";
export const MAX_PHOTO_MB = Number(process.env.NEXT_PUBLIC_MAX_PHOTO_MB ?? 25) || 25;
export const MAX_VIDEO_MB = Number(process.env.NEXT_PUBLIC_MAX_VIDEO_MB ?? 50) || 50;

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const ICON_TYPES = [...IMAGE_TYPES, "image/x-icon", "image/vnd.microsoft.icon", "image/svg+xml"];
export const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

/** Base inbox for the hidden admin login emails (see mobileToLoginEmail). */
export const ADMIN_LOGIN_EMAIL_BASE = process.env.NEXT_PUBLIC_ADMIN_LOGIN_EMAIL_BASE || "cnu.kunchala@gmail.com";
