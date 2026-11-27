"use client";
import { useEffect, useRef, useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & { src: string | null | undefined; fallbackSrc?: string | null; fallbackClassName?: string };

/** Lazy-loaded image with a graceful placeholder if the file is missing. */
export default function Img({ src: primary, fallbackSrc, alt = "", className, fallbackClassName, loading = "lazy", ...rest }: Props) {
  const [useFallback, setUseFallback] = useState(false);
  const src = useFallback ? fallbackSrc : primary;
  const [failed, setFailedRaw] = useState(false);
  const setFailed = (v: boolean) => (v && fallbackSrc && !useFallback ? setUseFallback(true) : setFailedRaw(v));
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  // Images can finish loading before hydration, in which case onLoad never fires
  useEffect(() => {
    const el = ref.current;
    if (el?.complete) {
      if (el.naturalWidth > 0) setLoaded(true);
      else setFailed(true);
    }
  }, [src]);
  if (!src || failed) {
    return (
      <div className={cn("flex items-center justify-center bg-paper-warm text-stone-light", className, fallbackClassName)} role="img" aria-label={alt}>
        <ImageOff className="h-6 w-6" strokeWidth={1.5} />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={src}
      alt={alt}
      loading={loading}
      decoding="async"
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
      className={cn("transition-opacity duration-700", loaded ? "opacity-100" : "opacity-0", className)}
      {...rest}
    />
  );
}
