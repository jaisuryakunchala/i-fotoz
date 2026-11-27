import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import Banner from "@/components/site/Banner";
import WhatsAppFab from "@/components/site/WhatsAppFab";
import PageViewTracker from "@/components/site/PageViewTracker";
import { getCategories, getSettings } from "@/lib/data";
import { isSupabaseConfigured, SITE_URL } from "@/lib/config";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [s, categories] = await Promise.all([getSettings(), getCategories()]);
  const hasBanner = s.banner_enabled && Boolean(s.banner_text.trim());

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: s.site_name,
    description: s.hero_description || s.tagline,
    url: SITE_URL,
    image: s.hero_image_url ?? undefined,
    logo: s.logo_url ?? undefined,
    telephone: s.phone || undefined,
    email: s.email || undefined,
    address: s.address || undefined,
    sameAs: [s.instagram_url, s.facebook_url, s.youtube_url].filter(Boolean),
  };

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-paper">
        Skip to content
      </a>
      {hasBanner && <Banner text={s.banner_text} link={s.banner_link} />}
      <Header name={s.site_name} logoUrl={s.logo_url} hasBanner={hasBanner} />
      <main id="main" className={hasBanner ? "[--top:112px]" : "[--top:72px]"}>{children}</main>
      <Footer s={s} categories={categories} />
      <WhatsAppFab number={s.whatsapp} studio={s.site_name} />
      {isSupabaseConfigured && <PageViewTracker />}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </>
  );
}
