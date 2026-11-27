/** Strips invisible / non-ASCII characters that sneak in when keys are copied from chats or documents. */
const clean = (v: string | undefined) => (v ?? "").replace(/[^\x21-\x7E]/g, "").replace(/^["']+|["']+$/g, "");

/**
 * The studio's Supabase project. The URL and anon ("public") key are designed to be public:
 * every visitor's browser receives them, and row level security protects the data.
 * Values in .env.local override these, but only if they look valid.
 */
const DEFAULT_SUPABASE_URL = "https://auxazrkggrgocpnprafh.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1eGF6cmtnZ3Jnb2NwbnByYWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU3NjgzMDMsImV4cCI6MjExMTM0NDMwM30.nFH96ITQGcQjel3HtKFDzLTrraE4ENlo-FCrod8twTg";

const envUrl = clean(process.env.NEXT_PUBLIC_SUPABASE_URL).replace(/\/$/, "");
const envKey = clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const looksLikeUrl = /^https:\/\/[a-z0-9-]+\.supabase\.(co|in)$/.test(envUrl) || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(envUrl);
const looksLikeKey = /^eyJ[\w-]+\.[\w-]+\.[\w-]+$/.test(envKey) || /^sb_publishable_[\w-]+$/.test(envKey) || envKey.startsWith("mock-");

export const SUPABASE_URL = looksLikeUrl && looksLikeKey ? envUrl : DEFAULT_SUPABASE_URL;
export const SUPABASE_ANON_KEY = looksLikeUrl && looksLikeKey ? envKey : DEFAULT_SUPABASE_ANON_KEY;

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
export const ADMIN_LOGIN_EMAIL_BASE = clean(process.env.NEXT_PUBLIC_ADMIN_LOGIN_EMAIL_BASE) || "cnu.kunchala@gmail.com";
