"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { formatDateLocal, getToday } from "@/lib/dates";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function monthFromIso(iso: string): Date {
  const [year, month] = iso.split("-").map(Number);
  return new Date(year, month - 1, 1);
}

export function DueDatePickerSheet({
  value,
  onSave,
  onClear,
  onCancel,
  title = "Set due date",
}: {
  value?: string;
  onSave: (date: string) => void;
  onClear: () => void;
  onCancel: () => void;
  title?: string;
}) {
  const today = getToday();
  const [draft, setDraft] = useState(value || today);
  const [cursor, setCursor] = useState(() => monthFromIso(value || today));
  const saveRef = useRef<HTMLButtonElement>(null);
  const onCancelRef = useRef(onCancel);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDow = new Date(year, month, 1).getDay();

  useEffect(() => {
    onCancelRef.current = onCancel;
  }, [onCancel]);

  useEffect(() => {
    saveRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      onCancelRef.current();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, []);

  const pickDay = (day: number) => {
    setDraft(formatDateLocal(new Date(year, month, day)));
  };

  const sheet = (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[80] bg-slate-900/40 dark:bg-black/55 cursor-default"
        aria-label="Cancel date picker"
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="due-date-picker-title"
        className="fixed left-4 right-4 bottom-4 safe-bottom z-[81] max-w-sm mx-auto surface-panel border rounded-2xl shadow-2xl p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <h2 id="due-date-picker-title" className="text-base font-semibold text-slate-900 dark:text-white">
            {title}
          </h2>
          {value ? (
            <button type="button" className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 touch-manipulation" onClick={onClear}>
              Clear
            </button>
          ) : null}
        </div>
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-[#1a2d4a] touch-manipulation"
            aria-label="Previous month"
            onClick={() => setCursor(new Date(year, month - 1, 1))}
          >
            <svg className="w-5 h-5 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 tabular-nums">
            {MONTH_NAMES[month]} {year}
          </p>
          <button
            type="button"
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-[#1a2d4a] touch-manipulation"
            aria-label="Next month"
            onClick={() => setCursor(new Date(year, month + 1, 1))}
          >
            <svg className="w-5 h-5 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={`${d}-${i}`} className="text-center text-[11px] font-medium text-slate-500 dark:text-slate-400 py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5 mb-4">
          {Array.from({ length: startDow }, (_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const iso = formatDateLocal(new Date(year, month, day));
            const selected = iso === draft;
            const isToday = iso === today;
            return (
              <button
                key={iso}
                type="button"
                onClick={() => pickDay(day)}
                aria-label={iso}
                aria-pressed={selected}
                className={`h-10 w-full rounded-lg text-sm tabular-nums touch-manipulation ${
                  selected
                    ? "bg-blue-700 text-white font-semibold"
                    : isToday
                      ? "text-blue-700 dark:text-blue-300 font-semibold ring-1 ring-blue-400/70"
                      : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1a2d4a]"
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn-chip px-3 py-2 text-sm touch-manipulation" onClick={onCancel}>
            Cancel
          </button>
          <button
            ref={saveRef}
            type="button"
            className="btn-primary flex-1 px-3 py-2 text-sm touch-manipulation"
            onClick={() => onSave(draft)}
          >
            Save
          </button>
        </div>
      </div>
    </>
  );

  if (typeof document === "undefined") return null;
  return createPortal(sheet, document.body);
}
