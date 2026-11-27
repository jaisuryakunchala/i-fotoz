import { cn } from "@/lib/utils";

export default function SectionHeading({ eyebrow, title, intro, align = "left", light = false, className }: {
  eyebrow: string; title: string; intro?: string; align?: "left" | "center"; light?: boolean; className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      <p className="label">{eyebrow}</p>
      <h2 className={cn("mt-4 font-display text-4xl leading-[1.05] sm:text-5xl lg:text-[56px]", light ? "text-paper" : "text-ink")}>{title}</h2>
      {intro && <p className={cn("mt-5 text-base leading-relaxed", light ? "text-paper/65" : "text-stone")}>{intro}</p>}
    </div>
  );
}
