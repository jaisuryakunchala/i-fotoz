import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CategoryFilter from "@/components/site/CategoryFilter";
import PageHeader from "@/components/site/PageHeader";
import PhotoGrid from "@/components/site/PhotoGrid";
import { getCategories, getCategoryBySlug, getPhotos } from "@/lib/data";

export const revalidate = 60;

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getCategories()).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const c = await getCategoryBySlug((await params).slug);
  if (!c) return { title: "Gallery not found" };
  return { title: c.name, description: c.description || `${c.name} by our studio.`, openGraph: { images: c.cover_url ? [c.cover_url] : undefined } };
}

export default async function CategoryPage({ params }: Params) {
  const { slug } = await params;
  const [category, categories] = await Promise.all([getCategoryBySlug(slug), getCategories()]);
  if (!category) notFound();
  const photos = await getPhotos({ categoryId: category.id, limit: 1000 });

  return (
    <>
      <PageHeader eyebrow={`${category.photo_count} ${category.photo_count === 1 ? "photograph" : "photographs"}`} title={category.name} intro={category.description} image={category.cover_url} />
      <section className="container-x py-12 sm:py-16">
        <div className="mb-10"><CategoryFilter categories={categories} active={category.slug} /></div>
        <PhotoGrid photos={photos} categories={[{ id: category.id, name: category.name }]} pageSize={30} />
      </section>
    </>
  );
}
