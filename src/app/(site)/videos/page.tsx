import type { Metadata } from "next";
import PageHeader from "@/components/site/PageHeader";
import VideoGallery from "@/components/site/VideoGallery";
import { getVideos } from "@/lib/data";

export const revalidate = 60;
export const metadata: Metadata = { title: "Videos", description: "Promotional films, event highlights and studio reels." };

export default async function VideosPage() {
  const videos = await getVideos();
  return (
    <>
      <PageHeader eyebrow="Films & Reels" title="Video Showcase" intro="Studio films, advertisements and highlights from weddings and events. Tap any video to play." />
      <section className="container-x py-12 sm:py-16">
        <VideoGallery videos={videos} />
      </section>
    </>
  );
}
