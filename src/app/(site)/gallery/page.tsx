import type { Metadata } from "next";
import CategoryFilter from "@/components/site/CategoryFilter";
import PageHeader from "@/components/site/PageHeader";
import PhotoGrid from "@/components/site/PhotoGrid";
import { getCategories, getPhotos } from "@/lib/data";

export const revalidate = 60;
export const metadata: Metadata = { title: "Photo Gallery", description: "Browse wedding, portrait, birthday, engagement, event and outdoor photography." };

export default async function GalleryPage() {
  const [categories, photos] = await Promise.all([getCategories(), getPhotos({ limit: 600 })]);
  return (
    <>
      <PageHeader eyebrow="Portfolio" title="The Gallery" intro="Every collection, in one place. Choose a category or browse everything — tap any photo to view it full screen." />
      <section className="container-x py-12 sm:py-16">
        <div className="mb-10"><CategoryFilter categories={categories} /></div>
        <PhotoGrid photos={photos} categories={categories.map(({ id, name }) => ({ id, name }))} pageSize={30} />
      </section>
    </>
  );
}
