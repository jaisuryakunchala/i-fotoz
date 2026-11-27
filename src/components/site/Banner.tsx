import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Banner({ text, link }: { text: string; link: string }) {
  const content = (
    <span className="inline-flex items-center gap-2 truncate">
      <span className="truncate">{text}</span>
      {link && <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-1" />}
    </span>
  );
  const cls = "group absolute inset-x-0 top-0 z-50 flex h-10 items-center justify-center bg-brass px-4 text-center text-xs font-semibold tracking-wide text-white sm:text-[13px]";
  if (!link) return <div className={cls}>{content}</div>;
  const external = /^https?:\/\//.test(link);
  return external ? (
    <a href={link} target="_blank" rel="noopener noreferrer" className={cls}>{content}</a>
  ) : (
    <Link href={link} className={cls}>{content}</Link>
  );
}
