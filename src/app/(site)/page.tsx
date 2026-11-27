import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight, Award, Camera, HeartHandshake, Sparkles } from "lucide-react";
import CategoryCards from "@/components/site/CategoryCards";
import ContactDetails from "@/components/site/ContactDetails";
import ContactForm from "@/components/site/ContactForm";
import FeaturedSlideshow from "@/components/site/FeaturedSlideshow";
import Img from "@/components/site/Img";
import PhotoGrid from "@/components/site/PhotoGrid";
import SectionHeading from "@/components/site/SectionHeading";
import VideoGallery from "@/components/site/VideoGallery";
import { getCategories, getPhotos, getSettings, getVideos } from "@/lib/data";

export const revalidate = 60;

export default async function HomePage() {
  const [s, categories, latest, featuredPhotos, featuredVideos, allVideos] = await Promise.all([
    getSettings(),
    getCategories(),
    getPhotos({ limit: 12 }),
    getPhotos({ featured: true, limit: 10 }),
    getVideos({ featured: true, limit: 6 }),
    getVideos({ limit: 3 }),
  ]);

  const featuredCats = categories.filter((c) => c.is_featured);
  const collections = (featuredCats.length ? featuredCats : categories).slice(0, 6);
  const slideshow = featuredPhotos.length ? featuredPhotos : latest.slice(0, 6);
  const videos = featuredVideos.length ? featuredVideos : allVideos;
  const catLite = categories.map(({ id, name }) => ({ id, name }));
  const totalPhotos = categories.reduce((n, c) => n + c.photo_count, 0);
  const aboutParas = s.about_text.split(/\n\s*\n/).filter(Boolean);

  return (
    <>
      {/* HERO */}
      <section className="relative flex min-h-[100svh] items-end overflow-hidden bg-ink">
        {s.hero_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.hero_image_url} alt="" fetchPriority="high" className="absolute inset-0 h-full w-full animate-kenburns object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/45" />
        <div className="container-x relative pb-16 pt-40 sm:pb-24">
          <p className="label animate-fadeUp !text-brass-light">{s.site_name} · Photography Studio</p>
          <h1 className="mt-5 max-w-4xl animate-fadeUp font-display text-[52px] leading-[0.98] text-white [animation-delay:120ms] sm:text-7xl lg:text-[104px]">
            {s.hero_heading || s.tagline}
          </h1>
          {s.hero_description && (
            <p className="mt-6 max-w-xl animate-fadeUp text-base leading-relaxed text-white/75 [animation-delay:240ms] sm:text-lg">{s.hero_description}</p>
          )}
          <div className="mt-9 flex animate-fadeUp flex-wrap gap-3 [animation-delay:360ms]">
            <Link href="/gallery" className="btn-brass">Explore Our Work <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/contact" className="btn-ghost-light">Book a Session</Link>
          </div>
          <div className="mt-14 flex items-end justify-between border-t border-white/15 pt-6">
            <dl className="flex gap-10 text-white">
              <div><dt className="text-[11px] uppercase tracking-widest text-white/50">Photographs</dt><dd className="mt-1 font-display text-3xl">{totalPhotos}+</dd></div>
              <div><dt className="text-[11px] uppercase tracking-widest text-white/50">Collections</dt><dd className="mt-1 font-display text-3xl">{categories.length}</dd></div>
            </dl>
            <a href="#collections" className="hidden items-center gap-2 text-xs uppercase tracking-widest text-white/60 transition hover:text-white sm:flex">
              Scroll <ArrowDown className="h-4 w-4 animate-bounce" />
            </a>
          </div>
        </div>
      </section>

      {/* FEATURED COLLECTIONS */}
      {collections.length > 0 && (
        <section id="collections" className="scroll-mt-20 py-20 sm:py-28">
          <div className="container-x">
            <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <SectionHeading eyebrow="Collections" title="Explore our featured galleries" intro="Browse by occasion — every collection is curated from real sessions at our studio and on location." />
              <Link href="/gallery" className="btn-outline shrink-0 self-start md:self-auto">View all galleries <ArrowUpRight className="h-4 w-4" /></Link>
            </div>
            <CategoryCards categories={collections} />
          </div>
        </section>
      )}

      {/* FEATURED SLIDESHOW */}
      {slideshow.length > 0 && (
        <section className="bg-paper-warm py-20 sm:py-28">
          <div className="container-x">
            <SectionHeading eyebrow="Featured Work" title="Frames we're proud of" className="mb-12" />
            <FeaturedSlideshow photos={slideshow} categories={catLite} />
          </div>
        </section>
      )}

      {/* LATEST UPLOADS */}
      {latest.length > 0 && (
        <section className="py-20 sm:py-28">
          <div className="container-x">
            <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <SectionHeading eyebrow="Latest Uploads" title="Fresh from the studio" intro="The newest photographs added to our portfolio." />
              <Link href="/gallery" className="link-underline inline-flex shrink-0 items-center gap-2 text-sm font-semibold">Full gallery <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <PhotoGrid photos={latest} categories={catLite} columns="4" pageSize={12} />
          </div>
        </section>
      )}

      {/* VIDEOS */}
      {videos.length > 0 && (
        <section className="bg-ink py-20 sm:py-28">
          <div className="container-x">
            <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <SectionHeading light eyebrow="Films & Reels" title="Moments in motion" intro="Promotional films, event highlights and studio reels." />
              <Link href="/videos" className="btn-ghost-light shrink-0 self-start md:self-auto">All videos <ArrowUpRight className="h-4 w-4" /></Link>
            </div>
            <VideoGallery videos={videos} dark />
          </div>
        </section>
      )}

      {/* ABOUT */}
      <section id="about" className="scroll-mt-20 py-20 sm:py-28">
        <div className="container-x grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div className="relative">
            <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-paper-warm">
              <Img src={s.about_image_url ?? s.hero_image_url} fallbackSrc={s.hero_image_url} alt={s.photographer_name ? `${s.photographer_name}, photographer at ${s.site_name}` : `The photographer at ${s.site_name}`} className="h-full w-full object-cover" fallbackClassName="h-full w-full" />
            </div>
            <div className="absolute -bottom-6 -right-2 hidden rounded-2xl bg-ink p-6 text-paper shadow-2xl sm:block lg:-right-8">
              <p className="font-display text-4xl text-brass-light">{s.photographer_name || s.site_name}</p>
              <p className="mt-1 text-xs uppercase tracking-widest text-paper/60">{s.photographer_credentials || s.tagline}</p>
            </div>
          </div>
          <div>
            <SectionHeading eyebrow="About Our Studio" title={s.about_heading || `About ${s.site_name}`} />
            <div className="mt-6 space-y-4 leading-relaxed text-stone">
              {aboutParas.length ? aboutParas.map((p, i) => <p key={i}>{p}</p>) : <p>{s.tagline}</p>}
            </div>
            <ul className="mt-10 grid gap-6 sm:grid-cols-2">
              {[
                { Icon: Camera, t: "Professional gear", d: "Modern cameras, lenses and studio lighting." },
                { Icon: HeartHandshake, t: "Personal attention", d: "Relaxed sessions with a friendly team." },
                { Icon: Sparkles, t: "Careful editing", d: "Every image colour-graded and retouched." },
                { Icon: Award, t: "On-time delivery", d: "Albums and digital files when promised." },
              ].map(({ Icon, t, d }) => (
                <li key={t} className="flex gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brass/10 text-brass-dark"><Icon className="h-5 w-5" strokeWidth={1.75} /></span>
                  <span><span className="block font-semibold">{t}</span><span className="mt-0.5 block text-sm text-stone">{d}</span></span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      {categories.length > 0 && (
        <section id="services" className="scroll-mt-20 bg-paper-warm py-20 sm:py-28">
          <div className="container-x grid gap-12 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <SectionHeading eyebrow="Our Services" title="Photography for every occasion" intro="From intimate portraits to full wedding coverage — tell us about your plans and we will put together the right package." />
              <Link href="/contact" className="btn-primary mt-8">Get a quote <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <ol className="border-t border-ink/10">
              {categories.map((c, i) => (
                <li key={c.id}>
                  <Link href={`/gallery/${c.slug}`} className="group grid grid-cols-[48px_1fr_auto] items-start gap-4 border-b border-ink/10 py-7 transition sm:grid-cols-[72px_1fr_auto] sm:py-8">
                    <span className="font-display text-2xl text-brass sm:text-3xl">{String(i + 1).padStart(2, "0")}</span>
                    <span>
                      <span className="block font-display text-3xl leading-tight transition group-hover:translate-x-1 sm:text-4xl">{c.name}</span>
                      {c.description && <span className="mt-2 block max-w-lg text-sm leading-relaxed text-stone">{c.description}</span>}
                    </span>
                    <ArrowUpRight className="mt-2 h-6 w-6 text-stone transition duration-300 group-hover:rotate-45 group-hover:text-ink" />
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* ENQUIRY */}
      <section id="contact" className="scroll-mt-20 bg-ink py-20 text-paper sm:py-28">
        <div className="container-x grid gap-14 lg:grid-cols-[1fr_1.3fr] lg:gap-20">
          <div>
            <SectionHeading light eyebrow="Enquiries" title="Let's plan your shoot" intro="Share a few details and the studio will get back to you with availability and pricing." />
            <div className="mt-10"><ContactDetails s={s} light /></div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[.03] p-6 sm:p-10">
            <ContactForm eventTypes={categories.map((c) => c.name)} whatsapp={s.whatsapp} studio={s.site_name} dark />
          </div>
        </div>
      </section>
    </>
  );
}
