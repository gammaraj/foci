"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase/client";

interface Step {
  target: string; // CSS selector
  title: string;
  description: string;
  position: "top" | "bottom" | "left" | "right";
}

const STEPS: Step[] = [
  {
    target: ".pause-button",
    title: "Focus Timer",
    description: "Start your work session here. The timer counts down and tracks your focus time.",
    position: "bottom",
  },
  {
    target: "#tasks-section",
    title: "Task List",
    description: "Add tasks to work on. Select a task before starting the timer to track time per task.",
    position: "top",
  },
  {
    target: "#dailyGoalProgress",
    title: "Daily Progress",
    description: "Track your daily session goal and build streaks to stay consistent.",
    position: "top",
  },
  {
    target: "[aria-label='Open settings']",
    title: "Settings",
    description: "Customize work duration, break duration, and daily goals to fit your workflow.",
    position: "bottom",
  },
];

export default function OnboardingTour() {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(-1);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (!user) return;
    // Already completed onboarding (persisted in Supabase user metadata)
    if (user.user_metadata?.onboarding_done) return;
    // Fast local cache to avoid showing again in same browser
    if (localStorage.getItem("foci_onboarding_done") || localStorage.getItem("tempo_onboarding_done")) return;
    // Only show for new signups: skip if account older than 5 minutes
    const createdAt = new Date(user.created_at).getTime();
    if (Date.now() - createdAt > 5 * 60 * 1000) {
      localStorage.setItem("foci_onboarding_done", "1");
      const supabase = createClient();
      supabase.auth.updateUser({ data: { onboarding_done: true } })
        .catch((err) => console.error("[Foci] Failed to save onboarding status:", err));
      return;
    }
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

    const rect = el.getBoundingClientRect();
    const style: React.CSSProperties = { position: "fixed", zIndex: 9999 };

    switch (step.position) {
      case "bottom":
        style.top = rect.bottom + 12;
        style.left = Math.max(16, rect.left + rect.width / 2 - 150);
        break;
      case "top":
        style.bottom = window.innerHeight - rect.top + 12;
        style.left = Math.max(16, rect.left + rect.width / 2 - 150);
        break;
      case "left":
        style.top = rect.top + rect.height / 2 - 40;
        style.right = window.innerWidth - rect.left + 12;
        break;
      case "right":
        style.top = rect.top + rect.height / 2 - 40;
        style.left = rect.right + 12;
        break;
    }

    // Keep within viewport
    if (typeof style.left === "number") {
      style.left = Math.min(style.left, window.innerWidth - 320);
    }

    setTooltipStyle(style);
  }, [currentStep]);

  useEffect(() => {
    positionTooltip();
    window.addEventListener("resize", positionTooltip);
    window.addEventListener("scroll", positionTooltip, true);
    return () => {
      window.removeEventListener("resize", positionTooltip);
      window.removeEventListener("scroll", positionTooltip, true);
    };
  }, [positionTooltip]);

  const finish = () => {
    setCurrentStep(-1);
    localStorage.setItem("foci_onboarding_done", "1");
    // Persist to Supabase user metadata so it survives across devices/browsers
    const supabase = createClient();
    supabase.auth.updateUser({ data: { onboarding_done: true } })
      .catch((err) => console.error("[Foci] Failed to save onboarding status:", err));
  };

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
        className="w-[calc(100vw-2rem)] max-w-[300px] bg-white dark:bg-[#131d30] border border-slate-200 dark:border-[#243350] rounded-xl shadow-2xl p-4 z-[9999]"
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
