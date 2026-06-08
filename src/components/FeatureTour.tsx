"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FEATURE_TOUR_STEPS,
  FEATURE_TOUR_START_EVENT,
  markWhatsNewSeen,
  type FeatureTourStep,
} from "@/lib/whats-new";

export default function FeatureTour() {
  const [currentStep, setCurrentStep] = useState(-1);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    const start = () => setCurrentStep(0);
    window.addEventListener(FEATURE_TOUR_START_EVENT, start);
    return () => window.removeEventListener(FEATURE_TOUR_START_EVENT, start);
  }, []);

  const finish = useCallback(() => {
    setCurrentStep(-1);
    markWhatsNewSeen();
  }, []);

  const positionTooltip = useCallback(() => {
    if (currentStep < 0 || currentStep >= FEATURE_TOUR_STEPS.length) return;

    const step = FEATURE_TOUR_STEPS[currentStep];
    const el = document.querySelector(step.target);
    if (!el) {
      if (currentStep < FEATURE_TOUR_STEPS.length - 1) {
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

    if (typeof style.left === "number") {
      style.left = Math.min(style.left, window.innerWidth - 320);
    }

    setTooltipStyle(style);
  }, [currentStep, finish]);

  useEffect(() => {
    if (currentStep < 0) return;
    const timer = setTimeout(() => requestAnimationFrame(positionTooltip), 100);
    window.addEventListener("resize", positionTooltip);
    window.addEventListener("scroll", positionTooltip, true);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", positionTooltip);
      window.removeEventListener("scroll", positionTooltip, true);
    };
  }, [currentStep, positionTooltip]);

  const next = () => {
    if (currentStep < FEATURE_TOUR_STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      finish();
    }
  };

  if (currentStep < 0 || currentStep >= FEATURE_TOUR_STEPS.length) return null;

  const step: FeatureTourStep = FEATURE_TOUR_STEPS[currentStep];
  const targetEl = document.querySelector(step.target);

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-[9998]" onClick={finish} aria-hidden />

      {targetEl && (
        <div
          className="fixed z-[9998] rounded-xl ring-4 ring-violet-500/50 pointer-events-none"
          style={{
            top: targetEl.getBoundingClientRect().top - 4,
            left: targetEl.getBoundingClientRect().left - 4,
            width: targetEl.getBoundingClientRect().width + 8,
            height: targetEl.getBoundingClientRect().height + 8,
          }}
        />
      )}

      <div
        style={tooltipStyle}
        role="dialog"
        aria-modal="true"
        aria-label={step.title}
        className="w-[calc(100vw-2rem)] max-w-[300px] bg-white dark:bg-[#131d30] border border-slate-200 dark:border-[#243350] rounded-xl shadow-2xl p-4 z-[9999]"
      >
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">{step.title}</h3>
          <span className="text-xs text-slate-400">
            {currentStep + 1}/{FEATURE_TOUR_STEPS.length}
          </span>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{step.description}</p>
        <div className="flex items-center justify-between mt-3">
          <button
            type="button"
            onClick={finish}
            className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors py-1"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={next}
            className="px-4 py-2 text-sm font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
          >
            {currentStep < FEATURE_TOUR_STEPS.length - 1 ? "Next" : "Done"}
          </button>
        </div>
      </div>
    </>
  );
}
