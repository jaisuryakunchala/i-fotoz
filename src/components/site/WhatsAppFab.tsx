import { whatsappLink } from "@/lib/utils";
import { WhatsAppIcon } from "./BrandIcons";

export default function WhatsAppFab({ number, studio }: { number: string; studio: string }) {
  const href = whatsappLink(number, `Hello ${studio}, I'd like to enquire about a photo shoot.`);
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp"
      className="fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/20 transition hover:scale-105 sm:bottom-7 sm:right-7">
      <WhatsAppIcon className="h-7 w-7" />
    </a>
  );
}
