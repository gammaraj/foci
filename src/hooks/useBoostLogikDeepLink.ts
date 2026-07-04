"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { bootstrapBoostLogikSession } from "@/lib/boostlogik-bootstrap";
import {
  loadBoostLogikContext,
  parseBoostLogikParams,
  saveBoostLogikContext,
  type BoostLogikContext,
} from "@/lib/boostlogik-integration";
import { trackBoostLogikDeepLinkApplied } from "@/lib/analytics";

interface UseBoostLogikDeepLinkOptions {
  authLoading: boolean;
  onApplyDuration: (minutes: number) => void;
  onSelectTask: (taskId: string) => void;
  onStartTask: (taskId: string) => void;
  onTasksChanged: () => void;
}

export function useBoostLogikDeepLink({
  authLoading,
  onApplyDuration,
  onSelectTask,
  onStartTask,
  onTasksChanged,
}: UseBoostLogikDeepLinkOptions) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const appliedRef = useRef(false);
  const [boostLogikContext, setBoostLogikContext] = useState<BoostLogikContext | null>(null);

  useEffect(() => {
    if (authLoading) return;

    const parsed = parseBoostLogikParams(searchParams);
    if (!parsed.isBoostLogikDeepLink) {
      const stored = loadBoostLogikContext();
      if (stored) setBoostLogikContext(stored);
      return;
    }

    if (appliedRef.current) return;
    appliedRef.current = true;

    let cancelled = false;

    (async () => {
      try {
        const result = await bootstrapBoostLogikSession(parsed);
        if (cancelled) return;

        saveBoostLogikContext(result.context);
        setBoostLogikContext(result.context);
        onTasksChanged();

        if (result.durationMinutes) {
          onApplyDuration(result.durationMinutes);
        }

        if (result.taskId) {
          onSelectTask(result.taskId);
          onStartTask(result.taskId);
        }

        trackBoostLogikDeepLinkApplied({
          ref: result.context.ref,
          projectId: result.context.projectId,
          projectName: result.context.projectName,
          task: result.context.task,
          durationMinutes: result.durationMinutes ?? undefined,
        });
      } finally {
        if (!cancelled) {
          router.replace("/app", { scroll: false });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    authLoading,
    searchParams,
    router,
    onApplyDuration,
    onSelectTask,
    onStartTask,
    onTasksChanged,
  ]);

  return { boostLogikContext };
}
