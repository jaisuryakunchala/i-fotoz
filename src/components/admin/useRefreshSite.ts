"use client";
import { useCallback } from "react";
import { refreshPublicSite } from "@/app/admin/actions";

/** Asks the server to rebuild cached public pages after content changes. */
export function useRefreshSite() {
  return useCallback(async () => {
    try {
      await refreshPublicSite();
    } catch (e) {
      console.warn("Could not refresh public pages; they will update within a minute.", e);
    }
  }, []);
}
