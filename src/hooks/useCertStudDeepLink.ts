"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { bootstrapCertStudSession } from "@/lib/certstud-bootstrap";
import {
  loadCertStudContext,
  parseCertStudParams,
  saveCertStudContext,
  type CertStudContext,
} from "@/lib/certstud-integration";
import { trackCertStudDeepLinkApplied } from "@/lib/analytics";

interface UseCertStudDeepLinkOptions {
  authLoading: boolean;
  onApplyDuration: (minutes: number) => void;
  onSelectTask: (taskId: string) => void;
  onStartTask: (taskId: string) => void;
  onTasksChanged: () => void;
}

export function useCertStudDeepLink({
  authLoading,
  onApplyDuration,
  onSelectTask,
  onStartTask,
  onTasksChanged,
}: UseCertStudDeepLinkOptions) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const appliedRef = useRef(false);
  const [certStudContext, setCertStudContext] = useState<CertStudContext | null>(null);

  useEffect(() => {
    if (authLoading) return;

    const parsed = parseCertStudParams(searchParams);
    if (!parsed.isCertStudDeepLink) {
      const stored = loadCertStudContext();
      if (stored) setCertStudContext(stored);
      return;
    }

    if (appliedRef.current) return;
    appliedRef.current = true;

    let cancelled = false;

    (async () => {
      try {
        const result = await bootstrapCertStudSession(parsed);
        if (cancelled) return;

        saveCertStudContext(result.context);
        setCertStudContext(result.context);
        onTasksChanged();

        if (result.durationMinutes) {
          onApplyDuration(result.durationMinutes);
        }

        if (result.taskId) {
          onSelectTask(result.taskId);
          onStartTask(result.taskId);
        }

        trackCertStudDeepLinkApplied({
          ref: result.context.ref,
          certId: result.context.certId,
          certCode: result.context.certCode,
          topic: result.context.topic,
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

  return { certStudContext };
}
