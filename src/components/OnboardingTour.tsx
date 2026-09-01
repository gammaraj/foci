"use client";

import { reportError } from "@/lib/report-error";
import { useState, useEffect, useCallback, useRef, type CSSProperties } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useFocusSession } from "@/components/FocusSessionProvider";
import { createClient } from "@/lib/supabase/client";
import { loadOneThing } from "@/lib/storage";
import { FIRST_WIN_EVENT, hasFirstWin } from "@/lib/first-win";
import {
  ONBOARDING_CHECKLIST,
  ONBOARDING_START_EVENT,
  ONE_THING_CHANGED_EVENT,
  currentOnboardingStep,
  finishOnboarding,
  isOnboardingDone,
  isOneThingSetToday,
  markOnboardingStarted,
  markOnboardingStepCompleted,
  markOnboardingStepViewed,
  resolveOnboardingChecks,
  skipOnboarding,
  type OnboardingChecks,
  type OnboardingStepId,
} from "@/lib/onboarding";
import { positionTourTooltip } from "@/lib/tour-tooltip";
import { FociDot } from "@/components/FociDot";

function queryVisibleTourTarget(selector: string): Element | null {
  const nodes = document.querySelectorAll(selector);
  for (const el of nodes) {
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) return el;
  }
  return null;
}

function waitForTourStart(onReady: () => void): () => void {
  let cancelled = false;
  const waitForTargets = () => {
    const firstTarget = queryVisibleTourTarget("#tasks-section");
    if (firstTarget && !cancelled) {
      onReady();
    } else if (!cancelled) {
      requestAnimationFrame(waitForTargets);
    }
  };
  const timer = setTimeout(() => requestAnimationFrame(waitForTargets), 300);
  return () => {
    cancelled = true;
    clearTimeout(timer);
  };
}

function emptyChecks(): OnboardingChecks {
  return resolveOnboardingChecks({ oneThingSet: false, hasFirstWin: false });
}

export default function OnboardingTour() {
  const { user, loading: authLoading } = useAuth();
  const { focusMode } = useFocusSession();
  const [open, setOpen] = useState(false);
  const [checks, setChecks] = useState<OnboardingChecks>(emptyChecks);
  const [tooltipStyle, setTooltipStyle] = useState<CSSProperties>({});
  const startedAtRef = useRef(0);
  const replayRef = useRef(false);
  const seenStepsRef = useRef<Set<string>>(new Set());
  const completedStepsRef = useRef<Set<OnboardingStepId>>(new Set());
  const finishTimerRef = useRef<number>(0);

  const activeStep = currentOnboardingStep(checks);
  const stepMeta =
    activeStep === "done" ? ONBOARDING_CHECKLIST[ONBOARDING_CHECKLIST.length - 1] : ONBOARDING_CHECKLIST.find((s) => s.id === activeStep);

  const refreshChecks = useCallback(async () => {
    const pref = await loadOneThing().catch(() => null);
    const next = resolveOnboardingChecks({
      oneThingSet: isOneThingSetToday(pref),
      hasFirstWin: hasFirstWin(),
    });
    setChecks((prev) => {
      for (const id of ["one-thing", "first-win"] as const) {
        if (next[id] && !prev[id] && !completedStepsRef.current.has(id)) {
          completedStepsRef.current.add(id);
          markOnboardingStepCompleted(id, startedAtRef.current);
        }
      }
      return next;
    });
    return next;
  }, []);

  const persistDone = useCallback(
    (mode: "finish" | "skip", step: OnboardingStepId | "done") => {
      if (mode === "skip") skipOnboarding(step, startedAtRef.current);
      else finishOnboarding(startedAtRef.current);
      if (user) {
        const supabase = createClient();
        supabase.auth
          .updateUser({ data: { onboarding_done: true } })
          .catch((err) => reportError("Failed to save onboarding status", err));
      }
      setOpen(false);
    },
    [user],
  );

  const begin = useCallback((opts?: { replay?: boolean }) => {
    window.clearTimeout(finishTimerRef.current);
    replayRef.current = !!opts?.replay;
    seenStepsRef.current = new Set(["ready"]);
    completedStepsRef.current = new Set(["ready"]);
    startedAtRef.current = markOnboardingStarted();
    markOnboardingStepViewed("ready");
    markOnboardingStepCompleted("ready", startedAtRef.current);
    setChecks(emptyChecks());
    void refreshChecks().finally(() => setOpen(true));
  }, [refreshChecks]);

  useEffect(() => {
    if (authLoading) return;

    if (user) {
      if (user.user_metadata?.onboarding_done) return;
      return waitForTourStart(begin);
    }

    if (isOnboardingDone()) return;
    return waitForTourStart(begin);
  }, [user, authLoading, begin]);

  useEffect(() => {
    let cancelWait: (() => void) | undefined;
    const start = () => {
      cancelWait?.();
      cancelWait = waitForTourStart(() => begin({ replay: true }));
    };
    window.addEventListener(ONBOARDING_START_EVENT, start);
    return () => {
      cancelWait?.();
      window.removeEventListener(ONBOARDING_START_EVENT, start);
    };
  }, [begin]);

  useEffect(() => {
    if (!open) return;
    const onProgress = () => {
      void refreshChecks();
    };
    window.addEventListener(FIRST_WIN_EVENT, onProgress);
    window.addEventListener(ONE_THING_CHANGED_EVENT, onProgress);
    window.addEventListener("tempo-session-complete", onProgress);
    return () => {
      window.removeEventListener(FIRST_WIN_EVENT, onProgress);
      window.removeEventListener(ONE_THING_CHANGED_EVENT, onProgress);
      window.removeEventListener("tempo-session-complete", onProgress);
    };
  }, [open, refreshChecks]);

  useEffect(() => {
    if (!open || activeStep === "done") return;
    if (seenStepsRef.current.has(activeStep)) return;
    seenStepsRef.current.add(activeStep);
    markOnboardingStepViewed(activeStep);
  }, [open, activeStep]);

  useEffect(() => {
    if (!open || activeStep !== "done" || replayRef.current) return;
    finishTimerRef.current = window.setTimeout(() => persistDone("finish", "done"), 1400);
    return () => window.clearTimeout(finishTimerRef.current);
  }, [open, activeStep, persistDone]);

  const positionHighlight = useCallback(() => {
    if (!open || !stepMeta || activeStep === "done" || activeStep === "ready") {
      setTooltipStyle({});
      return;
    }
    const el = queryVisibleTourTarget(stepMeta.target);
    if (!el) {
      setTooltipStyle({});
      return;
    }
    setTooltipStyle(positionTourTooltip(el.getBoundingClientRect(), "bottom"));
  }, [open, stepMeta, activeStep]);

  useEffect(() => {
    positionHighlight();
    window.addEventListener("resize", positionHighlight);
    window.addEventListener("scroll", positionHighlight, true);
    return () => {
      window.removeEventListener("resize", positionHighlight);
      window.removeEventListener("scroll", positionHighlight, true);
    };
  }, [positionHighlight]);

  if (!open || focusMode) return null;

  const targetEl =
    activeStep !== "done" && activeStep !== "ready" && stepMeta
      ? queryVisibleTourTarget(stepMeta.target)
      : null;
  const doneCount = ONBOARDING_CHECKLIST.filter((s) => checks[s.id]).length;

  return (
    <>
      {targetEl && (
        <div
          className="fixed z-[9998] rounded-xl ring-4 ring-blue-500/50 pointer-events-none"
          style={{
            top: targetEl.getBoundingClientRect().top - 4,
            left: targetEl.getBoundingClientRect().left - 4,
            width: targetEl.getBoundingClientRect().width + 8,
            height: targetEl.getBoundingClientRect().height + 8,
          }}
        />
      )}

      {targetEl && Object.keys(tooltipStyle).length > 0 && activeStep !== "done" && (
        <p
          style={tooltipStyle}
          className="hidden sm:block w-[calc(100%-2rem)] max-w-[300px] text-xs font-medium text-white bg-blue-700 dark:bg-blue-600 rounded-lg px-3 py-2 shadow-lg pointer-events-none"
        >
          {stepMeta?.hint}
        </p>
      )}

      <div
        role="dialog"
        aria-modal="false"
        aria-label="Get to your first win"
        className="fixed z-[9999] bottom-4 safe-bottom left-4 right-4 sm:left-auto sm:right-5 sm:w-[22rem] rounded-2xl app-surface dark:bg-[#131d30] border border-slate-200 dark:border-[#243350] shadow-2xl p-4"
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <FociDot
              mood={activeStep === "done" ? "happy" : "ready"}
              size={22}
              className="flex-shrink-0 text-blue-600 dark:text-blue-400"
            />
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                {activeStep === "done" ? "That’s the win" : "Get to your first win"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {activeStep === "done"
                  ? "Beavy’s buzzing. The rest is optional."
                  : "Tap the highlighted control."}
              </p>
            </div>
          </div>
          <span className="text-xs text-slate-400 shrink-0 tabular-nums pt-0.5">
            {doneCount}/{ONBOARDING_CHECKLIST.length}
          </span>
        </div>

        <ol className="space-y-1.5">
          {ONBOARDING_CHECKLIST.map((item) => {
            const done = checks[item.id];
            const current = item.id === activeStep;
            return (
              <li
                key={item.id}
                className={`flex items-start gap-2 rounded-lg px-2 py-1.5 text-sm ${
                  current ? "bg-blue-500/10 dark:bg-blue-400/10" : ""
                }`}
              >
                <span
                  className={`mt-0.5 inline-flex w-4 h-4 items-center justify-center rounded-full border text-[10px] font-bold shrink-0 ${
                    done
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : current
                        ? "border-blue-500 text-blue-600 dark:text-blue-300"
                        : "border-slate-300 dark:border-slate-600 text-transparent"
                  }`}
                  aria-hidden
                >
                  {done ? "✓" : ""}
                </span>
                <span className="min-w-0">
                  <span
                    className={`block font-medium ${
                      done
                        ? "text-slate-400 dark:text-slate-500 line-through"
                        : "text-slate-800 dark:text-slate-100"
                    }`}
                  >
                    {item.label}
                  </span>
                  {current && (
                    <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5 sm:hidden">
                      {item.hint}
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ol>

        <div className="flex items-center justify-end mt-3">
          <button type="button" onClick={() => persistDone("skip", activeStep)} className="btn-ghost px-2 py-1 text-sm">
            Skip tour
          </button>
        </div>
      </div>
    </>
  );
}
