import { Clock, Mail, MapPin, Phone } from "lucide-react";
import type { Settings } from "@/lib/types";
import { telLink, whatsappLink } from "@/lib/utils";
import { WhatsAppIcon } from "./BrandIcons";
import { SocialLinks } from "./Footer";

export default function ContactDetails({ s, light = false }: { s: Settings; light?: boolean }) {
  const wa = whatsappLink(s.whatsapp, `Hello ${s.site_name}, I'd like to enquire about a photo shoot.`);
  const rows = [
    s.phone && { Icon: Phone, label: "Call us", value: [s.phone, s.phone2].filter(Boolean).join("  ·  "), href: telLink(s.phone) },
    wa && { Icon: WhatsAppIcon, label: "WhatsApp", value: "Chat with the studio", href: wa, external: true },
    s.email && { Icon: Mail, label: "Email", value: s.email, href: `mailto:${s.email}` },
    s.address && { Icon: MapPin, label: "Studio", value: s.address },
    s.business_hours && { Icon: Clock, label: "Hours", value: s.business_hours },
  ].filter(Boolean) as { Icon: React.ComponentType<{ className?: string }>; label: string; value: string; href?: string; external?: boolean }[];

  const text = light ? "text-paper" : "text-ink";
  const muted = light ? "text-paper/55" : "text-stone";
  return (
    <div>
      <ul className="space-y-6">
        {rows.map(({ Icon, label, value, href, external }) => {
          const body = (
            <>
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${light ? "bg-white/10 text-brass-light" : "bg-brass/10 text-brass-dark"}`}>
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <span>
                <span className={`block text-xs font-semibold uppercase tracking-widest ${muted}`}>{label}</span>
                <span className={`mt-1 block whitespace-pre-line text-[15px] ${text}`}>{value}</span>
              </span>
            </>
          );
          return (
            <li key={label}>
              {href ? (
                <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="group flex gap-4 transition hover:opacity-80">{body}</a>
              ) : (
                <div className="flex gap-4">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
      <SocialLinks s={s} className={`mt-8 ${light ? "text-paper/80" : "text-ink"}`} />
    </div>
  );
}
