"use client";

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";

export type ToastType = "error" | "success" | "info";

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

function ToastIcon({ type }: { type: ToastType }) {
  if (type === "success") {
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    );
  }
  if (type === "info") {
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    );
  }
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
      />
    </svg>
  );
}

const toastChrome: Record<ToastType, string> = {
  success: "bg-emerald-600 text-white shadow-lg shadow-emerald-950/25",
  info: "bg-slate-700 text-slate-50 shadow-lg shadow-slate-950/30 dark:bg-slate-600",
  error: "bg-red-600 text-white shadow-lg shadow-red-950/25",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const showToast = useCallback(
    (message: string, type: ToastType = "info", action?: { label: string; onClick: () => void }) => {
      const id = crypto.randomUUID();
      setToasts((prev) => {
        if (prev.some((t) => t.message === message)) return prev;
        return [...prev.slice(-4), { id, message, type, action }];
      });
      const duration = type === "error" ? 6000 : 4000;
      const timer = setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
        timers.current.delete(id);
      }, duration);
      timers.current.set(id, timer);
    },
    [],
  );

  useEffect(() => {
    globalShowToast = showToast;
    return () => {
      globalShowToast = null;
    };
  }, [showToast]);

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-[calc(100%-2rem)] sm:w-auto"
        aria-live="polite"
        aria-relevant="additions"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`${toastChrome[toast.type]} px-3.5 py-3 rounded-xl shadow-lg flex items-start gap-2.5 animate-slide-up text-sm font-medium leading-snug`}
            role={toast.type === "error" ? "alert" : "status"}
          >
            <span className="mt-0.5 flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/20">
              <ToastIcon type={toast.type} />
            </span>
            <span className="flex-1 min-w-0 pt-0.5">{toast.message}</span>
            {toast.action && (
              <button
                type="button"
                onClick={() => {
                  toast.action!.onClick();
                  dismiss(toast.id);
                }}
                className="flex-shrink-0 font-semibold underline underline-offset-2 hover:no-underline ml-1 pt-0.5"
              >
                {toast.action.label}
              </button>
            )}
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity -mr-0.5 p-0.5 rounded"
              aria-label="Dismiss"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
