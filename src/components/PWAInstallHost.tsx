"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  PWA_INSTALL_OPEN_EVENT,
  ensureInstallPromptCapture,
  isStandaloneDisplay,
} from "@/lib/pwa-install";

const PWAInstallGuide = dynamic(() => import("@/components/PWAInstallGuide"), { ssr: false });

/** Captures Chrome install events and hosts the Add to Home Screen guide. */
export default function PWAInstallHost() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    ensureInstallPromptCapture();
    const onOpen = () => {
      if (isStandaloneDisplay()) return;
      setOpen(true);
    };
    window.addEventListener(PWA_INSTALL_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(PWA_INSTALL_OPEN_EVENT, onOpen);
  }, []);

  if (!open) return null;
  return <PWAInstallGuide onClose={() => setOpen(false)} />;
}
