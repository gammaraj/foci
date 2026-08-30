"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { resolveAnalyticsPageTitle } from "@/lib/analytics-page-title";
import { analyticsPagePath } from "@/lib/ga-attribution";

function shouldTrackPageView(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") return false;
  if (host.endsWith(".vercel.app")) return false;
  return typeof window.gtag === "function";
}

/** Sends page_view on App Router navigations with a stable (non-timer) page_title. */
export default function PageViewAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirst = useRef(true);

  useEffect(() => {
    if (!shouldTrackPageView()) return;

    const query = searchParams?.toString() ?? "";
    const pagePath = analyticsPagePath(pathname, query);
    const pageTitle = resolveAnalyticsPageTitle();

    // Initial load is sent by gtag config; avoid duplicate on first mount.
    // Still resolve so page_title stays pinned if the timer already overwrote document.title.
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }

    window.gtag!("event", "page_view", {
      page_path: pagePath,
      page_title: pageTitle,
      page_location: window.location.href,
    });
  }, [pathname, searchParams]);

  return null;
}
