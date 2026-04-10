"use client";

import { useState, useEffect, useCallback, useRef } from "react";

function detectBrowser(): string {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (ua.includes("Edg/")) return "edge";
  if (ua.includes("Chrome/") && !ua.includes("Edg/")) return "chrome";
  if (ua.includes("Firefox/")) return "firefox";
  if (ua.includes("Safari/") && !ua.includes("Chrome/")) return "safari";
  return "unknown";
}

function getBrowserInstructions(browser: string): { name: string; steps: string[] } {
  switch (browser) {
    case "chrome":
      return {
        name: "Chrome",
        steps: [
          "Click the lock/tune icon in the address bar (left of the URL)",
          "Find \"Notifications\" and change it to \"Allow\"",
          "Reload this page",
        ],
      };
    case "edge":
      return {
        name: "Edge",
        steps: [
          "Click the lock icon in the address bar",
          "Find \"Notifications\" and set it to \"Allow\"",
          "Reload this page",
        ],
      };
    case "firefox":
      return {
        name: "Firefox",
        steps: [
          "Click the lock icon in the address bar",
          "Click \"Connection secure\" → \"More information\"",
          "Go to Permissions tab, uncheck \"Block\" for Notifications",
          "Reload this page",
        ],
      };
    case "safari":
      return {
        name: "Safari",
        steps: [
          "Open Safari → Settings → Websites → Notifications",
          "Find this site and change it to \"Allow\"",
          "Reload this page",
        ],
      };
    default:
      return {
        name: "your browser",
        steps: [
          "Open your browser's site settings or permissions",
          "Find Notifications and change it to \"Allow\"",
          "Reload this page",
        ],
      };
  }
}

export default function NotificationBell() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [showHelp, setShowHelp] = useState(false);
  const helpRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    setPermission(Notification.permission);
  }, []);

  // Re-check when tab regains focus (user may have changed browser settings)
  useEffect(() => {
    const handleFocus = () => {
      if (typeof window !== "undefined" && "Notification" in window) {
        setPermission(Notification.permission);
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  // Close help popup on outside click
  useEffect(() => {
    if (!showHelp) return;
    const handleClick = (e: MouseEvent) => {
      if (helpRef.current && !helpRef.current.contains(e.target as Node)) {
        setShowHelp(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showHelp]);

  const handleClick = useCallback(async () => {
    if (!("Notification" in window)) return;

    if (Notification.permission === "default") {
      const result = await Notification.requestPermission();
      setPermission(result);
    } else if (Notification.permission === "denied") {
      setShowHelp((prev) => !prev);
    }
  }, []);

  const isGranted = permission === "granted";
  const isDenied = permission === "denied";

  const title = isGranted
    ? "Notifications enabled"
    : isDenied
      ? "Notifications blocked — click for help"
      : "Click to enable notifications";

  const browserInfo = getBrowserInstructions(detectBrowser());

  return (
    <div className="relative" ref={helpRef}>
      <button
        onClick={handleClick}
        className="relative text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10"
        aria-label={title}
        title={title}
      >
        {/* Bell icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Status dot */}
        {isGranted ? (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-green-400 ring-1 ring-green-500/50" />
        ) : (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-600 ring-1 ring-amber-600/50 animate-pulse" />
        )}
      </button>

      {/* Browser-specific help popup */}
      {showHelp && isDenied && (
        <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white dark:bg-[#1a2540] border border-slate-200 dark:border-[#2a3a5c] rounded-xl shadow-2xl z-50 p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Notifications blocked
            </h3>
            <button
              onClick={() => setShowHelp(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 -m-1"
              aria-label="Close"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            To enable notifications in {browserInfo.name}:
          </p>
          <ol className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5 list-decimal list-inside">
            {browserInfo.steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
