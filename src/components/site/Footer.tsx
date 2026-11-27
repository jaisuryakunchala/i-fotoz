import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import type { CategoryWithCount, Settings } from "@/lib/types";
import { safeExternalUrl, telLink, whatsappLink } from "@/lib/utils";
import Logo from "./Logo";
import { FacebookIcon, InstagramIcon, WhatsAppIcon, YoutubeIcon } from "./BrandIcons";

export function SocialLinks({ s, className = "" }: { s: Settings; className?: string }) {
  const items = [
    { url: safeExternalUrl(s.instagram_url), label: "Instagram", Icon: InstagramIcon },
    { url: safeExternalUrl(s.facebook_url), label: "Facebook", Icon: FacebookIcon },
    { url: safeExternalUrl(s.youtube_url), label: "YouTube", Icon: YoutubeIcon },
    { url: whatsappLink(s.whatsapp), label: "WhatsApp", Icon: WhatsAppIcon },
  ].filter((i) => i.url);
  if (!items.length) return null;
  return (
    <div className={`flex gap-2.5 ${className}`}>
      {items.map(({ url, label, Icon }) => (
        <a key={label} href={url!} target="_blank" rel="noopener noreferrer" aria-label={label}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 transition hover:border-brass hover:bg-brass hover:text-white">
          <Icon className="h-[18px] w-[18px]" />
        </a>
      ))}
    </div>
  );
}

export default function Footer({ s, categories }: { s: Settings; categories: CategoryWithCount[] }) {
  return (
    <footer className="bg-ink text-paper/70">
      <div className="container-x grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <Logo name={s.site_name} logoUrl={s.logo_url} light />
          <p className="mt-5 max-w-xs font-display text-2xl italic leading-snug text-paper">{s.tagline}</p>
          <SocialLinks s={s} className="mt-6 text-paper/80" />
        </div>
        <div>
          <h3 className="label mb-5">Explore</h3>
          <ul className="space-y-3 text-sm">
            {[["/", "Home"], ["/gallery", "Gallery"], ["/videos", "Videos"], ["/#about", "About Us"], ["/contact", "Contact"]].map(([href, label]) => (
              <li key={href}><Link href={href} className="link-underline hover:text-paper">{label}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="label mb-5">Galleries</h3>
          <ul className="space-y-3 text-sm">
            {categories.slice(0, 8).map((c) => (
              <li key={c.id}><Link href={`/gallery/${c.slug}`} className="link-underline hover:text-paper">{c.name}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="label mb-5">Visit the Studio</h3>
          <ul className="space-y-4 text-sm">
            {s.address && <li className="flex gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brass" /><span className="whitespace-pre-line">{s.address}</span></li>}
            {s.phone && <li className="flex gap-3"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-brass" /><a href={telLink(s.phone)} className="hover:text-paper">{s.phone}</a></li>}
            {s.email && <li className="flex gap-3"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-brass" /><a href={`mailto:${s.email}`} className="break-all hover:text-paper">{s.email}</a></li>}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col gap-2 py-6 text-xs text-paper/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {s.site_name}. All rights reserved.</p>
          <p>Photography studio · Weddings · Portraits · Events</p>
        </div>
      </div>
    </footer>
  );
}
