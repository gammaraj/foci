"use client";

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";

type ToastType = "error" | "success" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  action?: { label: string; onClick: () => void };
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, action?: { label: string; onClick: () => void }) => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

// Global accessor so non-React code (storage layer) can show toasts
let globalShowToast: ((message: string, type?: ToastType) => void) | null = null;
export function showToastGlobal(message: string, type: ToastType = "error") {
  globalShowToast?.(message, type);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const showToast = useCallback((message: string, type: ToastType = "error", action?: { label: string; onClick: () => void }) => {
    const id = crypto.randomUUID();
    setToasts((prev) => {
      if (prev.some((t) => t.message === message)) return prev;
      return [...prev.slice(-4), { id, message, type, action }];
    });
    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      timers.current.delete(id);
    }, 5000);
    timers.current.set(id, timer);
  }, []);

  useEffect(() => {
    globalShowToast = showToast;
    return () => { globalShowToast = null; };
  }, [showToast]);

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  };

  const iconMap: Record<ToastType, string> = {
    error: "⚠️",
    success: "✓",
    info: "ℹ",
  };
  const colorMap: Record<ToastType, string> = {
    error: "bg-red-600",
    success: "bg-green-600",
    info: "bg-blue-600",
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`${colorMap[toast.type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-up text-sm`}
            role="alert"
          >
            <span className="flex-shrink-0">{iconMap[toast.type]}</span>
            <span className="flex-1">{toast.message}</span>
            {toast.action && (
              <button
                onClick={() => { toast.action!.onClick(); dismiss(toast.id); }}
                className="flex-shrink-0 font-semibold text-white underline underline-offset-2 hover:no-underline ml-1"
              >
                {toast.action.label}
              </button>
            )}
            <button
              onClick={() => dismiss(toast.id)}
              className="flex-shrink-0 text-white/70 hover:text-white ml-2"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
