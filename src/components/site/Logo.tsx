"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

function Mark({ name, light }: { name: string; light: boolean }) {
  return (
    <>
      <svg viewBox="0 0 32 32" className="h-8 w-8 shrink-0 transition-transform duration-700 group-hover:rotate-90" aria-hidden="true">
        <circle cx="16" cy="16" r="13" fill="none" stroke="#B08447" strokeWidth="2.2" />
        <path d="M16 3v8M29 16h-8M16 29v-8M3 16h8" stroke="#B08447" strokeWidth="1.4" opacity=".55" />
        <circle cx="16" cy="16" r="4" fill={light ? "#F6F2EB" : "#151412"} />
      </svg>
      <span className={cn("font-display text-[26px] leading-none tracking-tight", light ? "text-white" : "text-ink")}>{name}</span>
    </>
  );
}

/** Uploaded / public logo image, falling back to the built-in mark if the file is missing. */
export default function Logo({ name, logoUrl, light = false, className }: { name: string; logoUrl?: string | null; light?: boolean; className?: string }) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    setFailed(false);
    const el = ref.current;
    if (el?.complete && el.naturalWidth === 0) setFailed(true); // errored before hydration
  }, [logoUrl]);

  return (
    <Link href="/" className={cn("group inline-flex items-center gap-2.5", className)} aria-label={`${name} — home`}>
      {logoUrl && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img ref={ref} src={logoUrl} alt={name} onError={() => setFailed(true)} className="h-10 w-auto max-w-[190px] object-contain sm:h-11" />
      ) : (
        <Mark name={name} light={light} />
      )}
    </Link>
  );
}
