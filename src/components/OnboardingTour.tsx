"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import {
  ONBOARDING_LEGACY_STORAGE_KEY,
  ONBOARDING_START_EVENT,
  ONBOARDING_STORAGE_KEY,
} from "@/lib/onboarding";
import { positionTourTooltip } from "@/lib/tour-tooltip";

interface Step {
  target: string; // CSS selector
  title: string;
  description: string;
  position: "top" | "bottom" | "left" | "right";
}

const STEPS: Step[] = [
  {
    target: "#tasks-section",
    title: "Your tasks & projects",
    description:
      "Add tasks and group them into projects. Start blank, or use a project template — workflows and financial life planning packs come with preset tasks.",
    position: "top",
  },
  {
    target: "[data-tour='add-project']",
    title: "Add a project",
    description:
      "Tap Add project to create one — name it yourself or pick a template with preset tasks. Quick Add on a card is for tasks inside that project.",
    position: "bottom",
  },
  {
    target: "[data-tour='view-modes']",
    title: "Views",
    description:
      "Switch between Cards, Buckets, List, and Calendar. Use Buckets to see every project side by side.",
    position: "bottom",
  },
  {
    target: "[data-tour='one-thing']",
    title: "Today's One Thing",
    description:
      "Open a task and tap Set as Today's One Thing — the one outcome that would make today a success. It stays pinned until you finish it.",
    position: "bottom",
  },
  {
    target: "[data-tour='done-tally']",
    title: "Done bar",
    description:
      "The Foci face cheers when you finish a task, and looks sadder after quiet days. Tap it to jump to today's completions.",
    position: "bottom",
  },
  {
    target: "[data-tour='time-filters']",
    title: "When",
    description:
      "Filter by All times, Today, Week, Month, or Year to see what's due.",
    position: "bottom",
  },
  {
    target: ".pause-button",
    title: "Optional focus timer",
    description:
      "Start a session when you want structure — Pomodoro, Deep Work, 52/17, and more. Time logs to the selected task.",
    position: "bottom",
  },
  {
    target: "#ambient-sounds",
    title: "Ambient music",
    description:
      "Built-in rain, café, and brown noise, plus Spotify, SoundCloud, and lo-fi — without leaving this window.",
    position: "bottom",
  },
  {
    target: "[data-tour='task-panel-menu']",
    title: "Templates, Smart Plan & settings",
    description:
      "Open ⋯ for Project templates, Import tasks, Settings, and to replay this tour. Use Layout → Plan for Smart Plan. Menu → Projects also opens create and manage.",
    position: "bottom",
  },
];

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
    const firstTarget = queryVisibleTourTarget(STEPS[0].target);
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

export default function OnboardingTour() {
  const { user, loading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(-1);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    // Wait for auth to resolve
    if (authLoading) return;

    // Authenticated: only Supabase metadata — don't use account age or guest
    // localStorage, so email-confirm delays and prior guest use still get the tour.
    if (user) {
      if (user.user_metadata?.onboarding_done) return;
      return waitForTourStart(() => setCurrentStep(0));
    }

    // Guest: localStorage only
    if (
      localStorage.getItem(ONBOARDING_STORAGE_KEY) ||
      localStorage.getItem(ONBOARDING_LEGACY_STORAGE_KEY)
    ) {
      return;
    }

    return waitForTourStart(() => setCurrentStep(0));
  }, [user, authLoading]);

  useEffect(() => {
    let cancelWait: (() => void) | undefined;
    const start = () => {
      cancelWait?.();
      cancelWait = waitForTourStart(() => setCurrentStep(0));
    };
    window.addEventListener(ONBOARDING_START_EVENT, start);
    return () => {
      cancelWait?.();
      window.removeEventListener(ONBOARDING_START_EVENT, start);
    };
  }, []);

  const finish = useCallback(() => {
    setCurrentStep(-1);
    localStorage.setItem(ONBOARDING_STORAGE_KEY, "1");
    if (user) {
      const supabase = createClient();
      supabase.auth.updateUser({ data: { onboarding_done: true } })
        .catch((err) => console.error("[Foci] Failed to save onboarding status:", err));
    }
  }, [user]);

  const positionTooltip = useCallback(() => {
    if (currentStep < 0 || currentStep >= STEPS.length) return;

    const step = STEPS[currentStep];
    const el = queryVisibleTourTarget(step.target);
    if (!el) {
      // Skip to next step if target not found
      if (currentStep < STEPS.length - 1) {
        setCurrentStep((s) => s + 1);
      } else {
        finish();
      }
      return;
    }

    setTooltipStyle(positionTourTooltip(el.getBoundingClientRect(), step.position));
  }, [currentStep, finish]);

  useEffect(() => {
    positionTooltip();
    window.addEventListener("resize", positionTooltip);
    window.addEventListener("scroll", positionTooltip, true);
    return () => {
      window.removeEventListener("resize", positionTooltip);
      window.removeEventListener("scroll", positionTooltip, true);
    };
  }, [positionTooltip]);

  const next = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      finish();
    }
  };

  const skip = () => {
    finish();
  };

  if (currentStep < 0 || currentStep >= STEPS.length) return null;

  const step = STEPS[currentStep];
  const targetEl = queryVisibleTourTarget(step.target);

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/40 z-[9998]" onClick={skip} />

      {/* Highlight the target element */}
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

      {/* Tooltip */}
      <div
        style={tooltipStyle}
        role="dialog"
        aria-modal="true"
        aria-label={step.title}
        className="w-[calc(100%-2rem)] max-w-[300px] bg-white dark:bg-[#131d30] border border-slate-200 dark:border-[#243350] rounded-xl shadow-2xl p-4 z-[9999]"
      >
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            {step.title}
          </h3>
          <span className="text-xs text-slate-400 dark:text-slate-400">
            {currentStep + 1}/{STEPS.length}
          </span>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {step.description}
        </p>
        <div className="flex items-center justify-between mt-3">
          <button
            onClick={skip}
            className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors py-1"
          >
            Skip tour
          </button>
          <button
            onClick={next}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {currentStep < STEPS.length - 1 ? "Next" : "Done"}
          </button>
        </div>
      </div>
    </>
  );
}
