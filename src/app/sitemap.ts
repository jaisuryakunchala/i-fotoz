import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config";
import { getCategories } from "@/lib/data";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const categories = await getCategories();
  const now = new Date();
  return [
    { url: `${SITE_URL}/`, lastModified: now, priority: 1 },
    { url: `${SITE_URL}/gallery`, lastModified: now, priority: 0.9 },
    { url: `${SITE_URL}/videos`, lastModified: now, priority: 0.7 },
    { url: `${SITE_URL}/contact`, lastModified: now, priority: 0.8 },
    ...categories.map((c) => ({ url: `${SITE_URL}/gallery/${c.slug}`, lastModified: now, priority: 0.8 })),
  ];
}
