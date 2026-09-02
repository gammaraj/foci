"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import type { Task } from "@/lib/types";
import type { OneThingStatus } from "@/lib/one-thing";
import { MAX_CUSTOM_QUOTE, parseQuote } from "@/lib/quotes";

export interface OneThingCardProps {
  status: OneThingStatus;
  task: Task | null;
  projectName?: string;
  hasOpenTasks: boolean;
  isTimerRunning: boolean;
  isFocused: boolean;
  /** Motivational line (custom sticky quote or today’s rotating quote). */
  quote?: string | null;
  /** True when the displayed quote is the user’s saved custom quote. */
  isCustomQuote?: boolean;
  /** Persist a custom quote (null clears → back to daily rotation). */
  onSaveQuote?: (quote: string | null) => void;
  onFocus: () => void;
  onComplete: () => void;
  onChange: () => void;
  onClear: () => void;
  onDismissEmpty?: () => void;
}

const twoCol =
  "no-print grid grid-cols-1 min-[520px]:grid-cols-[minmax(0,45fr)_minmax(0,55fr)] gap-x-3 gap-y-1 items-center panel-inset-x mt-1 mb-0.5 land-compact:hidden";

const plate =
  "flex items-center gap-2 min-h-[2.25rem] min-w-0 rounded-2xl px-2.5 py-1.5 border-0 ring-1";

const activePlate =
  "ring-blue-500/20 dark:ring-blue-400/25 bg-blue-500/[0.07] dark:bg-blue-500/10 border-l-[3px] border-l-blue-500 dark:border-l-blue-400";
const donePlate =
  "ring-emerald-500/20 dark:ring-emerald-400/25 bg-emerald-500/[0.07] dark:bg-emerald-500/10 border-l-[3px] border-l-emerald-500 dark:border-l-emerald-400";

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M12 2.25l2.472 6.342h6.668l-5.4 3.923 2.061 6.342L12 15.934l-5.801 3.923 2.061-6.342-5.4-3.923h6.668L12 2.25z" />
    </svg>
  );
}

function ChevronIcon({ open, className }: { open: boolean; className?: string }) {
  return (
    <svg
      className={`${className ?? ""} transition-transform ${open ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function OneThingHowTo() {
  return (
    <div className="rounded-2xl ring-1 ring-blue-500/15 dark:ring-blue-400/25 bg-[color:var(--surface-elevated)]/95 dark:bg-[#0f172a] text-slate-700 dark:text-slate-200 shadow-lg shadow-blue-900/5 dark:shadow-black/40 p-3.5 text-xs leading-relaxed text-center">
      <p className="font-semibold text-blue-900 dark:text-blue-100">How to pick your One Thing</p>
      <ol className="mt-1.5 mx-auto w-fit list-decimal list-inside space-y-1 text-left text-slate-600 dark:text-slate-300">
        <li>Open any open task (click its name).</li>
        <li>
          Tap <span className="font-semibold text-blue-700 dark:text-blue-300">Set as Today&apos;s One Thing</span>.
        </li>
      </ol>
      <p className="mt-2.5 text-slate-600 dark:text-slate-300">
        It&apos;s the one outcome that would make today a success. It stays pinned here until you finish or clear it, then
        resets tomorrow.
      </p>
    </div>
  );
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
      />
    </svg>
  );
}

function PinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20" aria-hidden>
      <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v12.5a.5.5 0 01-.8.4L10 14.118 5.8 16.9A.5.5 0 015 16.5V4z" />
    </svg>
  );
}

const quoteShell =
  "hidden min-[520px]:flex min-w-0 items-center gap-1.5 min-h-[2.25rem] rounded-xl px-2 py-1 ring-1 ring-slate-200/70 dark:ring-[#243350] bg-slate-50/70 dark:bg-white/[0.03]";

/** Quote reads as content, not chrome — warmer/brighter than Keep and the One Thing prompt. */
const quoteTextClass =
  "line-clamp-2 text-[13px] italic font-medium leading-snug text-slate-800 dark:text-stone-100";
const quoteAuthorClass = "not-italic font-normal text-slate-500 dark:text-stone-400";

function QuoteColumn({
  quote,
  isCustomQuote,
  onSaveQuote,
}: {
  quote?: string | null;
  isCustomQuote?: boolean;
  onSaveQuote?: (quote: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!editing) return;
    inputRef.current?.focus();
    const el = inputRef.current;
    if (el) {
      const len = el.value.length;
      el.setSelectionRange(len, len);
    }
  }, [editing]);

  const startEdit = (seed?: string) => {
    if (!onSaveQuote) return;
    setDraft((seed ?? quote ?? "").slice(0, MAX_CUSTOM_QUOTE));
    setEditing(true);
  };

  const commit = () => {
    if (!onSaveQuote) return;
    const next = draft.trim().slice(0, MAX_CUSTOM_QUOTE);
    setEditing(false);
    onSaveQuote(next || null);
  };

  const cancel = () => {
    setEditing(false);
    setDraft("");
  };

  if (editing && onSaveQuote) {
    return (
      <div className="hidden min-[520px]:flex min-w-0 flex-col gap-1 rounded-xl px-2 py-1.5 ring-1 ring-slate-200/70 dark:ring-[#243350] bg-slate-50/70 dark:bg-white/[0.03]">
        <textarea
          ref={inputRef}
          value={draft}
          maxLength={MAX_CUSTOM_QUOTE}
          rows={2}
          placeholder="A line that stays until you change it"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              cancel();
            }
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              commit();
            }
          }}
          className="w-full resize-none rounded-md px-1.5 py-1 text-[13px] italic font-medium text-slate-800 dark:text-stone-100 bg-[var(--surface-elevated)] dark:bg-[#0f172a] ring-1 ring-slate-200 dark:ring-[#243350] placeholder:not-italic placeholder:font-normal placeholder:text-slate-400 outline-none focus:ring-blue-500/50"
          aria-label="Your custom quote"
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-slate-400 tabular-nums">
            {draft.trim().length}/{MAX_CUSTOM_QUOTE}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={cancel}
              className="px-2 py-0.5 text-[11px] font-semibold rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-500/10 dark:hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={commit}
              className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!quote?.trim()) {
    if (!onSaveQuote) return null;
    return (
      <button
        type="button"
        onClick={() => startEdit("")}
        className={`${quoteShell} justify-center text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-500/[0.06] dark:hover:bg-blue-400/10 transition-colors`}
      >
        <PencilIcon className="w-3.5 h-3.5" />
        Add a quote
      </button>
    );
  }

  const { text, author } = parseQuote(quote);
  const label = author ? `${text} — ${author}` : text;
  const canEdit = !!onSaveQuote;

  return (
    <div className={quoteShell}>
      <span
        className={
          isCustomQuote
            ? "inline-flex items-center gap-0.5 shrink-0 rounded px-1 py-0.5 text-[10px] font-bold uppercase tracking-[0.05em] bg-blue-500/10 text-blue-700 dark:text-blue-300"
            : "inline-flex items-center shrink-0 rounded px-1 py-0.5 text-[10px] font-bold uppercase tracking-[0.05em] text-slate-500 dark:text-slate-400 bg-slate-500/10 dark:bg-white/5"
        }
        title={isCustomQuote ? "Stays until you change it" : "Changes each day"}
      >
        {isCustomQuote ? (
          <>
            <PinIcon className="w-2.5 h-2.5" />
            Pinned
          </>
        ) : (
          "Daily"
        )}
      </span>

      {canEdit ? (
        <button
          type="button"
          onClick={() => startEdit(quote)}
          className="min-w-0 flex-1 text-left rounded-md px-1 py-0.5 hover:bg-slate-500/[0.06] dark:hover:bg-white/[0.04] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
          title={`${label} — click to edit`}
        >
          <span className={quoteTextClass}>
            &ldquo;{text}&rdquo;
            {author ? <span className={quoteAuthorClass}> — {author}</span> : null}
          </span>
        </button>
      ) : (
        <p className={`min-w-0 flex-1 ${quoteTextClass}`} title={label}>
          &ldquo;{text}&rdquo;
          {author ? <span className={quoteAuthorClass}> — {author}</span> : null}
        </p>
      )}

      {canEdit && (
        <div className="flex items-center gap-0.5 shrink-0">
          {isCustomQuote ? (
            <button
              type="button"
              onClick={() => onSaveQuote(null)}
              className="px-1.5 py-0.5 text-[11px] font-semibold rounded-md text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 dark:hover:bg-blue-400/15"
              title="Back to daily rotating quotes"
            >
              Daily
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onSaveQuote(quote.trim().slice(0, MAX_CUSTOM_QUOTE))}
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[11px] font-semibold rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-500/10 dark:hover:bg-white/10"
              title="Keep showing this quote every day"
            >
              <PinIcon className="w-3 h-3 text-blue-600 dark:text-blue-400" />
              Keep
            </button>
          )}
          <button
            type="button"
            onClick={() => startEdit(quote)}
            className="inline-flex items-center justify-center p-1 rounded-md text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-500/10 dark:hover:bg-blue-400/15 transition-colors"
            aria-label="Edit quote"
            title="Edit quote"
          >
            <PencilIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export function OneThingCard({
  status,
  task,
  projectName,
  hasOpenTasks,
  isTimerRunning,
  isFocused,
  quote,
  isCustomQuote,
  onSaveQuote,
  onFocus,
  onComplete,
  onChange,
  onClear,
  onDismissEmpty,
}: OneThingCardProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const detailsId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  const closeDetails = useCallback(() => setDetailsOpen(false), []);

  useEffect(() => {
    if (!detailsOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDetails();
    };
    const onPointer = (e: MouseEvent | TouchEvent) => {
      const el = rootRef.current;
      if (el && !el.contains(e.target as Node)) closeDetails();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
    };
  }, [detailsOpen, closeDetails]);

  const quoteCol = (
    <QuoteColumn quote={quote} isCustomQuote={isCustomQuote} onSaveQuote={onSaveQuote} />
  );

  if (status === "unset") {
    const prompt = hasOpenTasks
      ? "Open a task → Set as One Thing"
      : "Add a task, then set it as your One Thing";

    return (
      <div ref={rootRef} data-tour="one-thing" className="relative min-w-0">
        <div className={`${twoCol} ${onDismissEmpty ? "pr-9 min-[520px]:pr-0" : ""}`}>
          <div className="relative flex items-center min-h-[2.25rem] min-w-0">
            <button
              type="button"
              onClick={() => setDetailsOpen((v) => !v)}
              aria-expanded={detailsOpen}
              aria-controls={detailsId}
              className="inline-flex items-center justify-center gap-1.5 sm:gap-2 max-w-full min-w-0 rounded-lg px-2 sm:px-3 py-1.5 text-left outline-none transition-colors hover:bg-blue-500/[0.08] dark:hover:bg-blue-400/10 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-[#0f172a]"
              title="How to set Today’s One Thing"
            >
              <StarIcon className="w-3.5 h-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
              <span className="shrink-0 text-xs font-bold uppercase tracking-[0.06em] text-blue-700 dark:text-blue-300">
                <span className="roomy:hidden">ONE</span>
                <span className="hidden roomy:inline">One Thing</span>
              </span>
              <span className="hidden sm:inline text-blue-400/70 dark:text-blue-500/70" aria-hidden>
                ·
              </span>
              <span className="min-w-0 truncate text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">
                {prompt}
              </span>
              <ChevronIcon
                open={detailsOpen}
                className="w-3.5 h-3.5 shrink-0 text-slate-400 dark:text-slate-500"
              />
              <span className="sr-only">{detailsOpen ? "Hide details" : "Show how to pick"}</span>
            </button>
            {onDismissEmpty && (
              <button
                type="button"
                onClick={onDismissEmpty}
                className="absolute right-0 top-1/2 -translate-y-1/2 min-[520px]:hidden p-1.5 rounded-full text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-500/10 dark:hover:bg-white/10"
                aria-label="Dismiss One Thing prompt"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {quoteCol}
        </div>
        {detailsOpen && (
          <div
            id={detailsId}
            role="region"
            aria-label="Today’s One Thing details"
            className="panel-inset-x mt-1 mb-1"
          >
            <OneThingHowTo />
          </div>
        )}
      </div>
    );
  }

  if (status === "done" && task) {
    return (
      <div data-tour="one-thing" className={twoCol}>
        <div className={`${plate} ${donePlate}`}>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="inline-flex items-center shrink-0 text-xs font-bold uppercase tracking-[0.06em] text-emerald-700 dark:text-emerald-300">
              Done
            </span>
            <p
              className="min-w-0 truncate text-sm font-medium text-slate-600 dark:text-emerald-50/90 line-through decoration-slate-400/70 dark:decoration-emerald-600/50"
              title={task.title}
            >
              {task.title}
            </p>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="shrink-0 text-xs font-semibold text-slate-500 dark:text-emerald-200/90 hover:text-slate-800 dark:hover:text-emerald-50 hover:underline px-1.5 py-0.5"
          >
            Clear
          </button>
        </div>
        {quoteCol}
      </div>
    );
  }

  if (status === "active" && task) {
    return (
      <div data-tour="one-thing" className={twoCol}>
        <div className={`${plate} ${activePlate}`}>
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
            <span
              className="inline-flex items-center gap-1 shrink-0 text-xs font-bold uppercase tracking-[0.06em] text-blue-700 dark:text-blue-300"
              title={projectName ? `Today's One Thing · ${projectName}` : "Today's One Thing"}
            >
              <StarIcon className="w-3 h-3 hidden min-[400px]:block" />
              <span className="roomy:hidden">ONE</span>
              <span className="hidden roomy:inline">One Thing</span>
            </span>
            <p
              className="min-w-0 truncate text-sm font-semibold text-slate-900 dark:text-white"
              title={projectName ? `${task.title} · ${projectName}` : task.title}
            >
              {task.title}
            </p>
          </div>
          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            <button
              type="button"
              onClick={onFocus}
              className={
                isFocused
                  ? "btn-primary gap-1 px-2 sm:px-2.5 py-1 text-xs"
                  : "inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 text-xs font-semibold rounded-lg text-blue-700 dark:text-blue-200 hover:bg-blue-500/10 dark:hover:bg-blue-400/15 transition-colors"
              }
              title={isFocused ? "Already focused" : isTimerRunning ? "Switch focus to One Thing" : "Focus and start timer"}
              aria-label={isFocused ? "Focused on One Thing" : "Focus on One Thing"}
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
              <span className="hidden min-[400px]:inline">{isFocused ? "On" : "Focus"}</span>
            </button>
            <button
              type="button"
              onClick={onComplete}
              data-tour="one-thing-done"
              className="inline-flex items-center px-2 sm:px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
            >
              Done
            </button>
            <button
              type="button"
              onClick={onChange}
              className="hidden sm:inline-flex items-center px-1.5 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              Change
            </button>
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center p-1 rounded-full text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-white hover:bg-slate-500/10 dark:hover:bg-white/10"
              aria-label="Clear One Thing"
              title="Clear"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        {quoteCol}
      </div>
    );
  }

  return null;
}
