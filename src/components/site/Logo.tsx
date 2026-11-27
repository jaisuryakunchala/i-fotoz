import Link from "next/link";
import { cn } from "@/lib/utils";

export default function Logo({ name, logoUrl, light = false, className }: { name: string; logoUrl?: string | null; light?: boolean; className?: string }) {
  return (
    <Link href="/" className={cn("group inline-flex items-center gap-2.5", className)} aria-label={`${name} — home`}>
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt={name} className="h-9 w-auto max-w-[180px] object-contain" />
      ) : (
        <>
          <svg viewBox="0 0 32 32" className="h-8 w-8 shrink-0 transition-transform duration-700 group-hover:rotate-90" aria-hidden="true">
            <circle cx="16" cy="16" r="13" fill="none" stroke="#B08447" strokeWidth="2.2" />
            <path d="M16 3v8M29 16h-8M16 29v-8M3 16h8" stroke="#B08447" strokeWidth="1.4" opacity=".55" />
            <circle cx="16" cy="16" r="4" fill={light ? "#F6F2EB" : "#151412"} />
          </svg>
          <span className={cn("font-display text-[26px] leading-none tracking-tight", light ? "text-white" : "text-ink")}>
            {name}
          </span>
        </>
      )}
    </Link>
  );
}
