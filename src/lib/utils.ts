export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function digitsOnly(value: string) {
  return value.replace(/[^\d]/g, "");
}

export function whatsappLink(number: string, text?: string) {
  const n = digitsOnly(number);
  if (!n) return "";
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export function telLink(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

/** Accepts a YouTube URL (watch, share, shorts, embed) or a bare 11-char id. */
export function youtubeId(input: string): string | null {
  const s = input.trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  try {
    const u = new URL(s);
    const host = u.hostname.replace(/^www\.|^m\./, "");
    if (host === "youtu.be") return u.pathname.slice(1, 12) || null;
    if (host === "youtube.com" || host === "youtube-nocookie.com") {
      const v = u.searchParams.get("v");
      if (v && /^[\w-]{11}$/.test(v)) return v;
      const m = u.pathname.match(/\/(?:embed|shorts|live|v)\/([\w-]{11})/);
      if (m) return m[1];
    }
  } catch {
    /* not a URL */
  }
  return null;
}

export function youtubeThumb(id: string) {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) {
  return new Date(iso).toLocaleDateString("en-IN", opts);
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function titleFromFilename(name: string) {
  return name
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 140);
}

/** Only allow Google Maps embed URLs inside the map iframe. Accepts a full <iframe> snippet too. */
export function safeMapEmbed(input: string): string | null {
  const src = input.match(/src="([^"]+)"/)?.[1] ?? input.trim();
  try {
    const u = new URL(src);
    if (u.protocol === "https:" && /(^|\.)google\.[a-z.]+$/.test(u.hostname) && (u.pathname.startsWith("/maps/embed") || (u.pathname === "/maps" && u.searchParams.get("output") === "embed"))) return u.toString();
  } catch {
    /* ignore */
  }
  return null;
}

export function safeExternalUrl(input: string): string | null {
  try {
    const u = new URL(input.trim());
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

export function errorMessage(err: unknown) {
  if (err && typeof err === "object" && "message" in err) return String((err as { message: unknown }).message);
  return String(err);
}

/** Normalises an Indian mobile number to its 10 digits, or null if it isn't one. */
export function normalizeMobile(input: string): string | null {
  let d = digitsOnly(input);
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  else if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? d : null;
}

/**
 * Admins sign in with a mobile number. Supabase's phone login needs a paid SMS provider,
 * so each admin account is created with a hidden login email derived from the number,
 * e.g. 9849305063 -> cnu.kunchala+9849305063@gmail.com (plus-addressing on the studio inbox).
 */
export function mobileToLoginEmail(mobile10: string, base: string) {
  const [local, domain] = base.split("@");
  return `${local}+${mobile10}@${domain}`.toLowerCase();
}

export function loginEmailToMobile(email: string | null | undefined): string | null {
  return email?.match(/\+(\d{10})@/)?.[1] ?? null;
}

/** Password rule for admin accounts: 8+ characters with an uppercase letter, a number and a special character. */
export function passwordProblem(pw: string): string | null {
  if (pw.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(pw)) return "Password needs at least one capital letter.";
  if (!/[a-z]/.test(pw)) return "Password needs at least one small letter.";
  if (!/\d/.test(pw)) return "Password needs at least one number.";
  if (!/[^A-Za-z0-9]/.test(pw)) return "Password needs at least one special character (e.g. @ # $ !).";
  return null;
}
