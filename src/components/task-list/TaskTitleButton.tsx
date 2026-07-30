"use client";

import type { KeyboardEvent, ReactNode } from "react";
import { useTitleOpenEdit } from "@/components/task-list/useTitleOpenEdit";

interface TaskTitleButtonProps {
  title: string;
  onOpen?: () => void;
  onRename?: () => void;
  className?: string;
  titleAttr?: string;
  children: ReactNode;
  /** When false, renders a non-interactive span (read-only). */
  interactive?: boolean;
}

/** Task title hit target: click opens edit panel; double-click renames when available. */
export function TaskTitleButton({
  title,
  onOpen,
  onRename,
  className = "",
  titleAttr,
  children,
  interactive = true,
}: TaskTitleButtonProps) {
  const { onClick, onDoubleClick } = useTitleOpenEdit(onOpen, onRename);

  if (!interactive || (!onOpen && !onRename)) {
    return (
      <span className={className} title={titleAttr ?? title}>
        {children}
      </span>
    );
  }

  const label =
    onOpen && onRename
      ? `Open "${title}". Double-click to rename.`
      : onOpen
        ? `Open "${title}"`
        : `Rename "${title}"`;

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick();
      }}
      onKeyDown={handleKeyDown}
      className={className}
      title={titleAttr ?? (onRename ? `${title} — click to edit, double-click to rename` : title)}
      aria-label={label}
    >
      {children}
    </button>
  );
}
