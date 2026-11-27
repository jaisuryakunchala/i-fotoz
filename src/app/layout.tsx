import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Manrope } from "next/font/google";
import { getSettings } from "@/lib/data";
import { SITE_URL } from "@/lib/config";
import "./globals.css";

const display = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-display", display: "swap" });
const sans = Manrope({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const description = s.hero_description || `${s.site_name} — professional photography studio for weddings, portraits, birthdays, engagements and events.`;
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: `${s.site_name} — ${s.tagline}`, template: `%s · ${s.site_name}` },
    description,
    openGraph: { type: "website", siteName: s.site_name, title: s.site_name, description, images: s.hero_image_url ? [s.hero_image_url] : undefined },
    twitter: { card: "summary_large_image" },
    icons: s.favicon_url ? { icon: s.favicon_url, apple: s.favicon_url } : undefined,
  };
}

export const viewport: Viewport = { themeColor: "#151412" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
