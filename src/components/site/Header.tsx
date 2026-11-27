"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, ArrowUpRight } from "lucide-react";
import Logo from "./Logo";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/gallery", label: "Gallery" },
  { href: "/videos", label: "Videos" },
  { href: "/#about", label: "About" },
  { href: "/#services", label: "Services" },
  { href: "/contact", label: "Contact" },
];

export default function Header({ name, logoUrl, hasBanner }: { name: string; logoUrl: string | null; hasBanner: boolean }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const overHero = pathname === "/" && !scrolled && !open;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : !href.includes("#") && pathname.startsWith(href));

  return (
    <header
      className={cn(
        "fixed inset-x-0 z-40 transition-all duration-500",
        hasBanner && !scrolled ? "top-10" : "top-0",
        overHero ? "bg-transparent" : "border-b border-paper-line/80 bg-paper/90 backdrop-blur-md",
      )}
    >
      <div className="container-x flex h-[72px] items-center justify-between gap-6">
        <Logo name={name} logoUrl={logoUrl} light={overHero} />

        <nav aria-label="Main" className="hidden items-center gap-8 lg:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "link-underline text-[13px] font-medium tracking-wide transition-colors",
                overHero ? "text-white/85 hover:text-white" : "text-ink-muted hover:text-ink",
                isActive(n.href) && (overHero ? "text-white after:w-full" : "text-ink after:w-full"),
              )}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/contact" className={cn("hidden sm:inline-flex", overHero ? "btn-ghost-light !px-5 !py-2.5" : "btn-primary !px-5 !py-2.5")}>
            Book a Shoot <ArrowUpRight className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className={cn("rounded-full p-2 lg:hidden", overHero ? "text-white" : "text-ink")}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="h-[calc(100dvh-72px)] overflow-y-auto border-t border-paper-line bg-paper animate-fadeIn lg:hidden">
          <nav aria-label="Mobile" className="container-x flex flex-col py-6">
            {NAV.map((n, i) => (
              <Link
                key={n.href}
                href={n.href}
                style={{ animationDelay: `${i * 50}ms` }}
                className="animate-fadeUp border-b border-paper-line py-4 font-display text-3xl text-ink"
              >
                {n.label}
              </Link>
            ))}
            <Link href="/contact" className="btn-primary mt-8 self-start">
              Book a Shoot <ArrowUpRight className="h-4 w-4" />
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
