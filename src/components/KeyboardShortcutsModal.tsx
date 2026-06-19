"use client";

import React, { useEffect } from "react";

const SHORTCUTS = [
  { keys: "Space", action: "Start or pause timer" },
  { keys: "R", action: "Reset timer" },
  { keys: "N", action: "Focus task input" },
  { keys: "F", action: "Toggle focus mode" },
  { keys: "?", action: "Show this help" },
  { keys: "Esc", action: "Close dialogs" },
];

interface KeyboardShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

export default function KeyboardShortcutsModal({ open, onClose }: KeyboardShortcutsModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
        className="w-full max-w-sm max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl app-surface dark:bg-[#131d30] p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="shortcuts-title" className="text-lg font-bold text-slate-900 dark:text-white mb-3">
          Keyboard shortcuts
        </h2>
        <ul className="space-y-2 mb-4">
          {SHORTCUTS.map((s) => (
            <li key={s.keys} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-slate-600 dark:text-slate-300">{s.action}</span>
              <kbd className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#1a2d4a] border border-slate-200 dark:border-[#243350] font-mono text-xs text-slate-700 dark:text-slate-200">
                {s.keys}
              </kbd>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2 text-sm font-medium rounded-lg bg-cyan-600 text-white hover:bg-cyan-700"
        >
          Close
        </button>
      </div>
    </div>
  );
}
