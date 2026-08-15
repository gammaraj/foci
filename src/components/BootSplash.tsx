"use client";

import { useEffect, useState } from "react";

/**
 * SSR boot splash for slow mobile opens. Must be dismissed via React state —
 * never document.getElementById(...).remove(), or soft navigations crash when
 * React reconciles a node that was deleted outside its tree.
 */
let dismissedThisSession = false;

export default function BootSplash() {
  const [visible, setVisible] = useState(() => !dismissedThisSession);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (dismissedThisSession) {
      setVisible(false);
      return;
    }
    dismissedThisSession = true;

    const prefersReduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      setVisible(false);
      return;
    }

    setFading(true);
    const timer = window.setTimeout(() => setVisible(false), 200);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      id="foci-boot"
      role="status"
      aria-live="polite"
      aria-label="Loading Foci"
      className={`foci-boot${fading ? " foci-boot--hide" : ""}`}
    >
      <div className="foci-boot-mark">Foci</div>
      <div className="foci-boot-msg">Loading…</div>
    </div>
  );
}
