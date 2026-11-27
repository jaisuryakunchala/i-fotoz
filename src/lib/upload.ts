"use client";
import imageCompression from "browser-image-compression";
import type { SupabaseClient } from "@supabase/supabase-js";
import { IMAGE_TYPES, MAX_PHOTO_MB, MAX_VIDEO_MB, MEDIA_BUCKET, SUPABASE_ANON_KEY, SUPABASE_URL, VIDEO_TYPES } from "@/lib/config";
import { formatBytes } from "@/lib/utils";

export type MediaKind = "image" | "video" | "icon";

export function validateFile(file: File, kind: MediaKind): string | null {
  const allowed = kind === "video" ? VIDEO_TYPES : kind === "icon" ? [...IMAGE_TYPES, "image/x-icon", "image/vnd.microsoft.icon", "image/svg+xml"] : IMAGE_TYPES;
  const maxMb = kind === "video" ? MAX_VIDEO_MB : kind === "icon" ? 2 : MAX_PHOTO_MB;
  if (!allowed.includes(file.type)) {
    const names = kind === "video" ? "MP4, WebM or MOV" : kind === "icon" ? "PNG, ICO, SVG, JPG or WebP" : "JPG, PNG, WebP or GIF";
    return `"${file.name}" is not a supported file. Please use ${names}.`;
  }
  if (file.size > maxMb * 1024 * 1024) return `"${file.name}" is ${formatBytes(file.size)}. The limit is ${maxMb} MB.`;
  return null;
}

function extFor(type: string) {
  return (
    { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/svg+xml": "svg", "image/x-icon": "ico", "image/vnd.microsoft.icon": "ico", "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov" } as Record<string, string>
  )[type] ?? "bin";
}

export function makePath(folder: string, file: Blob, suffix = "") {
  const d = new Date();
  const id = crypto.randomUUID();
  return `${folder}/${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${id}${suffix}.${extFor(file.type)}`;
}

export function publicUrl(path: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/${MEDIA_BUCKET}/${path.split("/").map(encodeURIComponent).join("/")}`;
}

async function readDimensions(blob: Blob): Promise<{ width: number; height: number } | null> {
  try {
    const bmp = await createImageBitmap(blob);
    const dims = { width: bmp.width, height: bmp.height };
    bmp.close();
    return dims;
  } catch {
    return null;
  }
}

/** Compresses the original and produces a lightweight thumbnail for gallery grids. */
export async function processPhoto(file: File) {
  if (file.type === "image/gif") {
    const dims = await readDimensions(file);
    return { full: file as Blob, thumb: file as Blob, width: dims?.width ?? null, height: dims?.height ?? null };
  }
  const full = await imageCompression(file, { maxWidthOrHeight: 2560, maxSizeMB: 3, initialQuality: 0.88, useWebWorker: true, fileType: "image/webp" });
  const thumb = await imageCompression(file, { maxWidthOrHeight: 900, maxSizeMB: 0.3, initialQuality: 0.8, useWebWorker: true, fileType: "image/webp" });
  const dims = await readDimensions(full);
  return { full: full as Blob, thumb: thumb as Blob, width: dims?.width ?? null, height: dims?.height ?? null };
}

/** Compresses images used for covers, hero backgrounds, logos etc. */
export async function processImage(file: File, maxSide = 2400): Promise<Blob> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return file;
  // keep PNG transparency for logos
  const fileType = file.type === "image/png" ? "image/png" : "image/webp";
  return imageCompression(file, { maxWidthOrHeight: maxSide, maxSizeMB: 2, initialQuality: 0.86, useWebWorker: true, fileType });
}

/** Grabs a frame from a video file to use as its thumbnail. */
export function captureVideoFrame(file: File, atSecond = 1): Promise<Blob | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.src = url;
    const done = (b: Blob | null) => {
      URL.revokeObjectURL(url);
      resolve(b);
    };
    const timer = setTimeout(() => done(null), 15000);
    video.onloadedmetadata = () => {
      video.currentTime = Math.min(atSecond, Math.max(0, (video.duration || 1) / 3));
    };
    video.onseeked = () => {
      clearTimeout(timer);
      const scale = Math.min(1, 1280 / (video.videoWidth || 1280));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round((video.videoWidth || 1280) * scale);
      canvas.height = Math.round((video.videoHeight || 720) * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return done(null);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((b) => done(b), "image/webp", 0.82);
    };
    video.onerror = () => {
      clearTimeout(timer);
      done(null);
    };
  });
}

/** Uploads straight to Supabase Storage with real progress reporting. Returns the storage path. */
export async function uploadFile(supabase: SupabaseClient, path: string, file: Blob, onProgress?: (fraction: number) => void): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Your session has expired. Please sign in again.");

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${SUPABASE_URL}/storage/v1/object/${MEDIA_BUCKET}/${path}`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("apikey", SUPABASE_ANON_KEY);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.setRequestHeader("cache-control", "max-age=31536000");
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded / e.total);
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(1);
        resolve();
      } else {
        let msg = `Upload failed (${xhr.status})`;
        try {
          const body = JSON.parse(xhr.responseText);
          msg = body.message || body.error || msg;
        } catch {
          /* ignore */
        }
        if (xhr.status === 413) msg = "File is larger than your storage plan allows.";
        reject(new Error(msg));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload. Check your connection and try again."));
    xhr.send(file);
  });
  return path;
}

/** Removes stored files. Null paths (external sample images) are ignored. */
export async function removeFiles(supabase: SupabaseClient, paths: Array<string | null | undefined>) {
  const list = paths.filter((p): p is string => Boolean(p));
  if (!list.length) return;
  for (let i = 0; i < list.length; i += 100) {
    const { error } = await supabase.storage.from(MEDIA_BUCKET).remove(list.slice(i, i + 100));
    if (error) throw error;
  }
}
