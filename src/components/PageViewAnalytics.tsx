"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

function shouldTrackPageView(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") return false;
  if (host.endsWith(".vercel.app")) return false;
  return typeof window.gtag === "function";
}

/** Sends page_view on App Router navigations with stable page_title from document.title. */
export default function PageViewAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirst = useRef(true);

  useEffect(() => {
    if (!shouldTrackPageView()) return;

    const query = searchParams?.toString();
    const pagePath = query ? `${pathname}?${query}` : pathname;

    // Initial load is sent by gtag config; avoid duplicate on first mount.
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }

    window.gtag!("event", "page_view", {
      page_path: pagePath,
      page_title: document.title,
      page_location: window.location.href,
    });
  }, [pathname, searchParams]);

  return null;
}
