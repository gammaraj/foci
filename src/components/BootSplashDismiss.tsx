"use client";

import { useEffect } from "react";

/**
 * Removes the SSR #foci-boot splash once React has hydrated.
 * Covers the black/empty gap while JS downloads on slow mobile networks.
 */
export default function BootSplashDismiss() {
  useEffect(() => {
    const el = document.getElementById("foci-boot");
    if (!el) return;

    const prefersReduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      el.remove();
      return;
    }

    el.style.opacity = "0";
    el.style.pointerEvents = "none";
    const timer = window.setTimeout(() => el.remove(), 200);
    return () => window.clearTimeout(timer);
  }, []);

  return null;
}
