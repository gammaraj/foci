"use client";

import { useEffect } from "react";
import { BusyBeaver } from "@/components/BusyBeaver";
import { reportError } from "@/lib/report-error";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError("Route error", error, { digest: error.digest });
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-page px-4">
      <EmptyState
        titleAs="h2"
        title="Beavy dropped a log on this page"
        body="We've been notified. Give it another chew — try again."
        bodyClassName="text-base text-slate-600 dark:text-slate-400"
        illustration={
          <BusyBeaver
            alt="Beavy the Beaver looking concerned"
            size={140}
            className="mx-auto"
            priority
          />
        }
        action={
          <Button size="lg" onClick={() => reset()}>
            Try again
          </Button>
        }
      />
    </div>
  );
}
