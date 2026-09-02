"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import dynamic from "next/dynamic";
import { useCertStudDeepLink } from "@/hooks/useCertStudDeepLink";
import { useBoostLogikDeepLink } from "@/hooks/useBoostLogikDeepLink";
import TaskList from "@/components/TaskList";
import { useFocusSession } from "@/components/FocusSessionProvider";
import { useAuth } from "@/components/AuthProvider";
import CertStudStudyPromo from "@/components/CertStudStudyPromo";
import BoostLogikPromo from "@/components/BoostLogikPromo";
import { Spinner } from "@/components/ui/Spinner";

const OnboardingTour = dynamic(() => import("@/components/OnboardingTour"));
const FeatureTour = dynamic(() => import("@/components/FeatureTour"));

export default function AppPageClient() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[40vh]">
          <Spinner size="lg" className="text-blue-500" />
        </div>
      }
    >
      <AppPageContent />
    </Suspense>
  );
}

function AppPageContent() {
  const { loading } = useAuth();
  const {
    activeTaskId,
    setActiveTaskId,
    handleStartTask,
    handleCompleteTask,
    isRunning,
    focusMode,
    handleSelectWorkPreset,
  } = useFocusSession();
  const [taskListKey, setTaskListKey] = useState(0);
  const [tasksFullscreen, setTasksFullscreen] = useState(false);

  useEffect(() => {
    const onImported = () => setTaskListKey((k) => k + 1);
    window.addEventListener("foci-tasks-imported", onImported);
    return () => window.removeEventListener("foci-tasks-imported", onImported);
  }, []);

  const handleApplyCertStudDuration = useCallback(
    (minutes: number) => {
      handleSelectWorkPreset(minutes);
    },
    [handleSelectWorkPreset],
  );

  const handleCertStudTasksChanged = useCallback(() => {
    setTaskListKey((k) => k + 1);
  }, []);

  const { certStudContext } = useCertStudDeepLink({
    authLoading: loading,
    onApplyDuration: handleApplyCertStudDuration,
    onSelectTask: setActiveTaskId,
    onStartTask: handleStartTask,
    onTasksChanged: handleCertStudTasksChanged,
  });

  const { boostLogikContext } = useBoostLogikDeepLink({
    authLoading: loading,
    onApplyDuration: handleApplyCertStudDuration,
    onSelectTask: setActiveTaskId,
    onStartTask: handleStartTask,
    onTasksChanged: handleCertStudTasksChanged,
  });

  return (
    <div className="py-1.5 sm:py-2">
      <div className={tasksFullscreen ? "w-full px-2 sm:px-4" : "app-container"}>
        {certStudContext && !focusMode && (
          <div className="no-print">
            <CertStudStudyPromo context={certStudContext} className="mb-3" />
          </div>
        )}

        {boostLogikContext && !focusMode && (
          <div className="no-print">
            <BoostLogikPromo context={boostLogikContext} className="mb-3" />
          </div>
        )}

        <div id="tasks-section" className="w-full">
          <Suspense fallback={null}>
            <TaskList
              key={taskListKey}
              activeTaskId={activeTaskId}
              onSelectTask={setActiveTaskId}
              onStartTask={handleStartTask}
              onCompleteTask={handleCompleteTask}
              isTimerRunning={isRunning}
              isFullscreen={tasksFullscreen}
              onToggleFullscreen={() => setTasksFullscreen((f) => !f)}
              focusMode={focusMode}
              onOpenSettings={() => window.dispatchEvent(new CustomEvent("foci-open-settings"))}
            />
          </Suspense>
        </div>
      </div>

      <OnboardingTour />
      <FeatureTour />
    </div>
  );
}
