"use client";

import React, { useEffect, useRef, useState } from "react";
import { FociWordmark } from "@/components/FociLogoMark";
import { BusyBeaver } from "@/components/BusyBeaver";
import { FOCI_WORDMARK_INLINE } from "@/lib/logo-brand";
import {
  FOCI_APP_INSTALL_URL,
  consumeDeferredInstallPrompt,
  getDeferredInstallPrompt,
  isIosDevice,
  shouldShowInstallQr,
  subscribeInstallPrompt,
} from "@/lib/pwa-install";

interface PWAInstallGuideProps {
  onClose: () => void;
}

export default function PWAInstallGuide({ onClose }: PWAInstallGuideProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [canNativeInstall, setCanNativeInstall] = useState(
    () => Boolean(getDeferredInstallPrompt()),
  );
  const [installing, setInstalling] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQr] = useState(() => shouldShowInstallQr());
  const [ios] = useState(() => isIosDevice());

  useEffect(() => {
    return subscribeInstallPrompt(() => {
      setCanNativeInstall(Boolean(getDeferredInstallPrompt()));
    });
  }, []);

  useEffect(() => {
    closeRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab" && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          }
        } else if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleNativeInstall = async () => {
    const promptEvent = getDeferredInstallPrompt();
    if (!promptEvent) return;
    setInstalling(true);
    try {
      await promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      consumeDeferredInstallPrompt();
      setCanNativeInstall(false);
      if (outcome === "accepted") onClose();
    } finally {
      setInstalling(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(FOCI_APP_INSTALL_URL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-[9990]" onClick={onClose} aria-hidden />
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pwa-install-title"
        className="fixed left-4 right-4 bottom-4 safe-bottom z-[9991] max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto bg-white dark:bg-[#131d30] border border-slate-200 dark:border-[#243350] rounded-xl shadow-2xl p-5 sm:left-1/2 sm:right-auto sm:bottom-auto sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full"
      >
        <div className="flex items-start gap-3 mb-4">
          <BusyBeaver alt="" size={44} className="flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <h3 id="pwa-install-title" className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
              Add <FociWordmark className={FOCI_WORDMARK_INLINE} tone="light" /> to your Home Screen
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              One tap from your home screen — Beavy works offline for tasks and sounds.
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="flex-shrink-0 p-2 -m-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {canNativeInstall && (
          <button
            type="button"
            onClick={handleNativeInstall}
            disabled={installing}
            className="btn-primary w-full mb-4 px-4 py-2.5 text-sm"
          >
            {installing ? "Opening…" : "Install app"}
          </button>
        )}

        {ios && (
          <ol className="space-y-3 mb-4 text-sm text-slate-700 dark:text-slate-200">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center justify-center">
                1
              </span>
              <span>
                Tap the <strong className="font-semibold">Share</strong> button
                <span className="inline-flex align-middle mx-1 text-blue-600 dark:text-blue-400" aria-hidden>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3l4 4h-3v8h-2V7H8l4-4zm-7 14h14v2H5v-2z" />
                  </svg>
                </span>
                in Safari (bottom center on iPhone).
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center justify-center">
                2
              </span>
              <span>
                Scroll and tap <strong className="font-semibold">Add to Home Screen</strong>.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center justify-center">
                3
              </span>
              <span>
                Tap <strong className="font-semibold">Add</strong> — Foci appears like an app.
              </span>
            </li>
          </ol>
        )}

        {!ios && !canNativeInstall && (
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
            In Chrome or Edge, open the browser menu and choose{" "}
            <strong className="font-semibold">Install app</strong> or{" "}
            <strong className="font-semibold">Add to Home screen</strong>.
          </p>
        )}

        {showQr && (
          <div className="rounded-lg border border-slate-200 dark:border-[#243350] bg-slate-50 dark:bg-[#0f172a] p-3 sm:p-4 mb-3">
            <p className="app-section-label text-slate-500 dark:text-slate-400 mb-2">
              On your phone
            </p>
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/install-app-qr.png"
                alt="QR code linking to usefoci.com/app"
                width={120}
                height={120}
                className="w-[7.5rem] h-[7.5rem] rounded-md bg-white p-1.5 shrink-0"
              />
              <div className="min-w-0 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                <p>Scan to open Foci on your phone, then add it to the Home Screen.</p>
                <p className="mt-1.5 font-medium text-slate-800 dark:text-slate-100 break-all">
                  usefoci.com/app
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="btn-chip px-3 py-1.5 text-sm"
          >
            {copied ? "Copied" : "Copy link"}
          </button>
          <a
            href={FOCI_APP_INSTALL_URL}
            className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            Open usefoci.com/app
          </a>
          <a
            href="/install"
            className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            Full install guide
          </a>
        </div>
      </div>
    </>
  );
}
