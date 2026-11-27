"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/client";

/** Records anonymous page views for the admin visit statistics. */
export default function PageViewTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname || /bot|crawl|spider/i.test(navigator.userAgent)) return;
    getSupabaseBrowser().from("page_views").insert({ path: pathname.slice(0, 300) }).then(() => undefined);
  }, [pathname]);
  return null;
}
