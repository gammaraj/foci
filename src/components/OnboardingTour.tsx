"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase/client";
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
    title: "Your tasks",
    description:
      "Add tasks and organize them into projects. Cards view is the default — each project shows its top open work.",
    position: "top",
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
      "Pick the one task that would make today a success. It stays pinned above your list until you finish it.",
    position: "bottom",
  },
  {
    target: "[data-tour='time-filters']",
    title: "Filters & progress",
    description:
      "Filter by All, Today, Week, Month, or Year. The tally nearby shows how much you've completed.",
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
    title: "Smart Plan & settings",
    description:
      "Open ⋯ for Smart Plan (day-by-day scheduling), Settings & import (Todoist, Notion, and more), and templates.",
    position: "bottom",
  },
];

export default function OnboardingTour() {
  const { user, loading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(-1);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    // Wait for auth to resolve
    if (authLoading) return;

    // Check if already completed (works for both guest and authenticated users)
    if (localStorage.getItem("foci_onboarding_done") || localStorage.getItem("tempo_onboarding_done")) return;

    // For authenticated users: check Supabase metadata and account age
    if (user) {
      if (user.user_metadata?.onboarding_done) return;
      // Only show for new signups: skip if account older than 5 minutes
      const createdAt = new Date(user.created_at).getTime();
      if (Date.now() - createdAt > 5 * 60 * 1000) {
        localStorage.setItem("foci_onboarding_done", "1");
        const supabase = createClient();
        supabase.auth.updateUser({ data: { onboarding_done: true } })
          .catch((err) => console.error("[Foci] Failed to save onboarding status:", err));
        return;
      }
    }

    // Show tour for both guest users and new authenticated users
    // Delay until the page has actually rendered
    let cancelled = false;
    const waitForTargets = () => {
      const firstTarget = document.querySelector(STEPS[0].target);
      if (firstTarget && !cancelled) {
        setCurrentStep(0);
      } else if (!cancelled) {
        requestAnimationFrame(waitForTargets);
      }
    };
    // Give initial render a moment to settle
    const timer = setTimeout(() => requestAnimationFrame(waitForTargets), 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [user, authLoading]);

  const finish = useCallback(() => {
    setCurrentStep(-1);
    localStorage.setItem("foci_onboarding_done", "1");
    if (user) {
      const supabase = createClient();
      supabase.auth.updateUser({ data: { onboarding_done: true } })
        .catch((err) => console.error("[Foci] Failed to save onboarding status:", err));
    }
  }, [user]);

  const positionTooltip = useCallback(() => {
    if (currentStep < 0 || currentStep >= STEPS.length) return;

    const step = STEPS[currentStep];
    const el = document.querySelector(step.target);
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
  const targetEl = document.querySelector(step.target);

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
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
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
