import Img from "./Img";

/** Header band for inner pages; optional background photo. */
export default function PageHeader({ eyebrow, title, intro, image }: { eyebrow: string; title: string; intro?: string; image?: string | null }) {
  if (image) {
    return (
      <section className="relative overflow-hidden bg-ink pb-16 pt-[calc(var(--top)+64px)] sm:pb-24">
        <Img src={image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-45" loading="eager" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-ink/30" />
        <div className="container-x relative animate-fadeUp">
          <p className="label !text-brass-light">{eyebrow}</p>
          <h1 className="mt-4 max-w-3xl font-display text-5xl leading-[1.02] text-white sm:text-6xl lg:text-7xl">{title}</h1>
          {intro && <p className="mt-5 max-w-xl text-white/70">{intro}</p>}
        </div>
      </section>
    );
  }
  return (
    <section className="border-b border-paper-line pb-12 pt-[calc(var(--top)+56px)] sm:pb-16">
      <div className="container-x animate-fadeUp">
        <p className="label">{eyebrow}</p>
        <h1 className="mt-4 max-w-3xl font-display text-5xl leading-[1.02] sm:text-6xl lg:text-7xl">{title}</h1>
        {intro && <p className="mt-5 max-w-xl text-stone">{intro}</p>}
      </div>
    </section>
  );
}
