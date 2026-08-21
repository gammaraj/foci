"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FEATURE_TOUR_STEPS,
  FEATURE_TOUR_START_EVENT,
  markWhatsNewSeen,
  type FeatureTourStep,
} from "@/lib/whats-new";
import { positionTourTooltip } from "@/lib/tour-tooltip";
import { FociDot } from "@/components/FociDot";

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

    setTooltipStyle(positionTourTooltip(el.getBoundingClientRect(), step.position));
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
          className="fixed z-[9998] rounded-xl ring-4 ring-blue-500/50 pointer-events-none"
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
        className="w-[calc(100%-2rem)] max-w-[300px] bg-white dark:bg-[#131d30] border border-slate-200 dark:border-[#243350] rounded-xl shadow-2xl p-4 z-[9999]"
      >
        <div className="flex items-center justify-between mb-1 gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            {step.title === "Done bar" && (
              <FociDot mood="happy" size={20} className="flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
            )}
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">{step.title}</h3>
          </div>
          <span className="text-xs text-slate-400 shrink-0">
            {currentStep + 1}/{FEATURE_TOUR_STEPS.length}
          </span>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{step.description}</p>
        <div className="flex items-center justify-between mt-3">
          <button
            type="button"
            onClick={finish}
            className="btn-ghost px-2 py-1 text-sm"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={next}
            className="btn-primary px-4 py-2 text-sm"
          >
            {currentStep < FEATURE_TOUR_STEPS.length - 1 ? "Next" : "Done"}
          </button>
        </div>
      </div>
    </>
  );
}
