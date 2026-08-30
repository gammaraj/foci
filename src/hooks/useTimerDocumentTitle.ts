"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { rememberAnalyticsPageTitle } from "@/lib/analytics-page-title";
import {
  formatTimerDisplay,
  formatTimerTabTitle,
  getTimerTabLabel,
  isTimerTabTitle,
} from "@/lib/timer-utils";
import type { TimerStatus } from "@/lib/types";

/**
 * While a focus/break session is active, put MM:SS first in the browser tab title
 * so the countdown is visible when the tab is in the background.
 * Keeps GA4 `page_title` on the real page title via rememberAnalyticsPageTitle.
 */
export function useTimerDocumentTitle(status: TimerStatus, remainingTime: number) {
  const pathname = usePathname();
  const baseTitleRef = useRef<string | null>(null);
  const label = getTimerTabLabel(status);
  const displayTime = formatTimerDisplay(remainingTime);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const apply = () => {
      if (!isTimerTabTitle(document.title)) {
        baseTitleRef.current = document.title;
        rememberAnalyticsPageTitle(document.title);
      } else if (baseTitleRef.current) {
        // Timer title is showing — pin GA to the real page title.
        rememberAnalyticsPageTitle(baseTitleRef.current);
      }

      if (!label) {
        if (baseTitleRef.current && isTimerTabTitle(document.title)) {
          document.title = baseTitleRef.current;
          rememberAnalyticsPageTitle(baseTitleRef.current);
        }
        return;
      }

      const next = formatTimerTabTitle(displayTime, label);
      if (document.title !== next) document.title = next;
      if (baseTitleRef.current) {
        rememberAnalyticsPageTitle(baseTitleRef.current);
      }
    };

    apply();
    // Next.js metadata may overwrite <title> after a client navigation.
    const t = window.setTimeout(apply, 0);
    return () => clearTimeout(t);
  }, [label, displayTime, pathname]);

  useEffect(() => {
    return () => {
      if (baseTitleRef.current && isTimerTabTitle(document.title)) {
        document.title = baseTitleRef.current;
        rememberAnalyticsPageTitle(baseTitleRef.current);
      }
    };
  }, []);
}
