"use client";

import React, { useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  return (
    <Modal
      onClose={onCancel}
      role="alertdialog"
      labelledBy="confirm-title"
      describedBy="confirm-message"
      sizeClassName="max-w-sm"
      initialFocusRef={cancelRef}
    >
      <h3 id="confirm-title" className="text-lg font-semibold text-slate-900 dark:text-white mb-1.5">
        {title}
      </h3>
      <p id="confirm-message" className="text-sm text-slate-600 dark:text-slate-300 mb-5 leading-relaxed">
        {message}
      </p>
      <div className="flex items-center justify-end gap-2">
        <Button ref={cancelRef} variant="ghost" size="md" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button
          variant={variant === "danger" ? "danger" : "primary"}
          size="md"
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
