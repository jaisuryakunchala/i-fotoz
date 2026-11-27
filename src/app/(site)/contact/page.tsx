import type { Metadata } from "next";
import ContactDetails from "@/components/site/ContactDetails";
import ContactForm from "@/components/site/ContactForm";
import PageHeader from "@/components/site/PageHeader";
import { getCategories, getSettings } from "@/lib/data";
import { safeMapEmbed } from "@/lib/utils";

export const revalidate = 60;
export const metadata: Metadata = { title: "Contact", description: "Contact the studio to book a wedding, portrait, birthday or event shoot." };

export default async function ContactPage() {
  const [s, categories] = await Promise.all([getSettings(), getCategories()]);
  const map = safeMapEmbed(s.map_embed_url);
  return (
    <>
      <PageHeader eyebrow="Contact" title="Let's create something beautiful" intro="Call, message or send an enquiry — we usually reply within a few hours during studio hours." />
      <section className="container-x grid gap-14 py-14 sm:py-20 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
        <ContactDetails s={s} />
        <div className="rounded-3xl border border-paper-line bg-white p-6 shadow-sm sm:p-10">
          <h2 className="font-display text-3xl">Send an enquiry</h2>
          <p className="mb-8 mt-1 text-sm text-stone">Fields marked * are required. Share a phone number or an email.</p>
          <ContactForm eventTypes={categories.map((c) => c.name)} whatsapp={s.whatsapp} studio={s.site_name} />
        </div>
      </section>
      {map && (
        <section className="container-x pb-20">
          <div className="aspect-[16/9] overflow-hidden rounded-3xl border border-paper-line sm:aspect-[21/8]">
            <iframe src={map} title={`${s.site_name} location`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="h-full w-full grayscale-[.3]" allowFullScreen />
          </div>
        </section>
      )}
    </>
  );
}
