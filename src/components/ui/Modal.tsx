"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface ModalProps {
  open?: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Accessible name element id */
  labelledBy?: string;
  describedBy?: string;
  role?: "dialog" | "alertdialog";
  /** Max width utility, e.g. max-w-sm / max-w-md */
  sizeClassName?: string;
  panelClassName?: string;
  /** Bottom-sheet on mobile (default) vs centered always */
  placement?: "sheet" | "center";
  initialFocusRef?: React.RefObject<HTMLElement | null>;
}

export function Modal({
  open = true,
  onClose,
  children,
  labelledBy,
  describedBy,
  role = "dialog",
  sizeClassName = "max-w-md",
  panelClassName,
  placement = "sheet",
  initialFocusRef,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const target = initialFocusRef?.current ?? panelRef.current;
    target?.focus?.();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose, initialFocusRef]);

  if (!open) return null;

  const sheetPlacement =
    placement === "sheet"
      ? "fixed left-4 right-4 bottom-4 safe-bottom sm:left-1/2 sm:right-auto sm:bottom-auto sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full"
      : "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)]";

  return (
    <>
      <div className="modal-overlay modal-overlay--popover" onClick={onClose} />
      <div
        ref={panelRef}
        role={role}
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        tabIndex={-1}
        className={cn(
          "modal-panel max-h-[calc(100vh-2rem)] overflow-y-auto p-5 outline-none",
          sheetPlacement,
          sizeClassName,
          panelClassName,
        )}
      >
        {children}
      </div>
    </>
  );
}
