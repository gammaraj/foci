"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

const SHORTCUTS = [
  { keys: "Space", action: "Start or pause timer" },
  { keys: "R", action: "Reset timer" },
  { keys: "N", action: "Focus task input" },
  { keys: "F", action: "Toggle Zen mode" },
  { keys: "?", action: "Show this help" },
  { keys: "Esc", action: "Close dialogs" },
];

interface KeyboardShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

export default function KeyboardShortcutsModal({ open, onClose }: KeyboardShortcutsModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      labelledBy="shortcuts-title"
      sizeClassName="max-w-sm"
      placement="center"
    >
      <h2 id="shortcuts-title" className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
        Keyboard shortcuts
      </h2>
      <ul className="space-y-2 mb-4">
        {SHORTCUTS.map((s) => (
          <li key={s.keys} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-slate-600 dark:text-slate-300">{s.action}</span>
            <kbd className="px-2 py-0.5 rounded-md bg-surface-muted dark:bg-surface-hover border border-surface-border text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-200">
              {s.keys}
            </kbd>
          </li>
        ))}
      </ul>
      <Button variant="primary" size="md" className="w-full" onClick={onClose}>
        Close
      </Button>
    </Modal>
  );
}
