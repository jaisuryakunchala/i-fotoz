// Generates src/lib/sample-data.json (demo mode) and supabase/seed.sql (database sample content)
import { writeFileSync } from "node:fs";
import { categories, videos, settings, U } from "./sample-source.mjs";

const q = (v) => (v === null || v === undefined ? "null" : typeof v === "boolean" ? String(v) : `'${String(v).replace(/'/g, "''")}'`);
const uuid = (n, prefix) => `${prefix}-0000-4000-8000-${String(n).padStart(12, "0")}`;

const now = Date.UTC(2026, 10, 20);
let photoN = 0;
const cats = [], photos = [];
categories.forEach((c, i) => {
  const id = uuid(i + 1, "00000000");
  cats.push({ id, name: c.name, slug: c.slug, description: c.description, cover_url: U(c.photos[0][0], 1200), cover_path: null, sort_order: i, is_featured: c.featured, created_at: new Date(now - i * 1e6).toISOString() });
  c.photos.forEach(([pid, title], j) => {
    photoN++;
    photos.push({ id: uuid(photoN, "10000000"), category_id: id, title, description: `${title} — ${c.name.toLowerCase()} by i Fotoz.`, tags: [c.slug.split("-")[0]], url: U(pid, 2000), path: null, thumb_url: U(pid, 800), thumb_path: null, width: null, height: null, status: "published", is_featured: j === 0, created_at: new Date(now - (j * 8 + i) * 3.6e6).toISOString() });
  });
});
const vids = videos.map((v, i) => ({ id: uuid(i + 1, "20000000"), title: v.title, description: v.description, source: "upload", url: v.url, path: null, thumbnail_url: v.thumb, thumbnail_path: null, status: "published", is_featured: v.featured, created_at: new Date(now - i * 3.6e6).toISOString() }));

writeFileSync("src/lib/sample-data.json", JSON.stringify({ settings, categories: cats, photos, videos: vids }, null, 2) + "\n");

let sql = `-- i Fotoz sample content. Run AFTER schema.sql (optional). Delete the samples any time from the admin dashboard.\n\n`;
sql += `update public.settings set\n` + Object.entries(settings).map(([k, v]) => `  ${k} = ${q(v)}`).join(",\n") + `,\n  updated_at = now()\nwhere id = 1;\n\n`;
sql += `insert into public.categories (id, name, slug, description, cover_url, sort_order, is_featured) values\n` +
  cats.map((c) => `  (${q(c.id)}, ${q(c.name)}, ${q(c.slug)}, ${q(c.description)}, ${q(c.cover_url)}, ${c.sort_order}, ${c.is_featured})`).join(",\n") + `\non conflict (slug) do nothing;\n\n`;
sql += `insert into public.photos (id, category_id, title, description, tags, url, thumb_url, status, is_featured, created_at) values\n` +
  photos.map((p) => `  (${q(p.id)}, ${q(p.category_id)}, ${q(p.title)}, ${q(p.description)}, array[${p.tags.map(q).join(",")}]::text[], ${q(p.url)}, ${q(p.thumb_url)}, 'published', ${p.is_featured}, ${q(p.created_at)})`).join(",\n") + `\non conflict (id) do nothing;\n\n`;
sql += `insert into public.videos (id, title, description, source, url, thumbnail_url, status, is_featured, created_at) values\n` +
  vids.map((v) => `  (${q(v.id)}, ${q(v.title)}, ${q(v.description)}, 'upload', ${q(v.url)}, ${q(v.thumbnail_url)}, 'published', ${v.is_featured}, ${q(v.created_at)})`).join(",\n") + `\non conflict (id) do nothing;\n`;
writeFileSync("supabase/seed.sql", sql);
console.log(`categories=${cats.length} photos=${photos.length} videos=${vids.length}`);
