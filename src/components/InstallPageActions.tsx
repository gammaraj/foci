"use client";

import { useEffect, useState } from "react";
import {
  FOCI_APP_INSTALL_URL,
  consumeDeferredInstallPrompt,
  ensureInstallPromptCapture,
  getDeferredInstallPrompt,
  isIosDevice,
  isStandaloneDisplay,
  subscribeInstallPrompt,
} from "@/lib/pwa-install";

type InstallPageActionsProps = {
  /** When false, parent layout owns the QR (desktop side rail). Default true. */
  showQr?: boolean;
};

/** Optional one-tap Android install + copy/open helpers for /install. */
export default function InstallPageActions({ showQr = true }: InstallPageActionsProps) {
  const [canNativeInstall, setCanNativeInstall] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [copied, setCopied] = useState(false);
  const [ios, setIos] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [wideEnoughForQr, setWideEnoughForQr] = useState(false);

  useEffect(() => {
    ensureInstallPromptCapture();
    setIos(isIosDevice());
    setStandalone(isStandaloneDisplay());
    setWideEnoughForQr(window.matchMedia("(min-width: 768px)").matches);
    setCanNativeInstall(Boolean(getDeferredInstallPrompt()));
    return subscribeInstallPrompt(() => {
      setCanNativeInstall(Boolean(getDeferredInstallPrompt()));
    });
  }, []);

  const handleNativeInstall = async () => {
    const promptEvent = getDeferredInstallPrompt();
    if (!promptEvent) return;
    setInstalling(true);
    try {
      await promptEvent.prompt();
      await promptEvent.userChoice;
      consumeDeferredInstallPrompt();
      setCanNativeInstall(false);
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

  if (standalone) {
    return (
      <p className="mt-6 text-sm font-medium text-green-700 dark:text-green-400">
        Foci is already installed on this device — open it from your home screen anytime.
      </p>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {canNativeInstall && (
        <button
          type="button"
          onClick={handleNativeInstall}
          disabled={installing}
          className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {installing ? "Opening…" : "Install with one tap (Android / Chrome)"}
        </button>
      )}

      {ios && (
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          On iPhone there is no one-tap install button — Apple requires the Safari Share menu below.
          Use Safari (not Chrome) on this phone.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-300 dark:border-[#243350] text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-[#131d30] transition-colors"
        >
          {copied ? "Copied" : "Copy usefoci.com/app"}
        </button>
        <a
          href={FOCI_APP_INSTALL_URL}
          className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          Open the app
        </a>
      </div>

      {showQr && wideEnoughForQr && (
        <div className="flex items-center gap-3 pt-1 lg:hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/install-app-qr.png"
            alt="QR code linking to usefoci.com/app"
            width={112}
            height={112}
            className="w-28 h-28 rounded-md bg-white p-1.5 shrink-0"
          />
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            On a computer? Scan with your phone camera, open in{" "}
            <strong className="font-semibold text-slate-800 dark:text-slate-200">
              {ios ? "Safari" : "Chrome"}
            </strong>
            , then follow the steps below.
          </p>
        </div>
      )}
    </div>
  );
}
