"use client";

import React from "react";
import * as Sentry from "@sentry/nextjs";
import { BusyBeaver } from "@/components/BusyBeaver";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[Foci] Uncaught error:", error, info.componentStack);
    Sentry.captureException(error, {
      contexts: { react: { componentStack: info.componentStack } },
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <div className="text-center max-w-md">
            <BusyBeaver alt="Beavy the Beaver looking concerned" size={96} className="mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Beavy dropped a log on this page
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Something unexpected floated downstream. Try refreshing.
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="btn-primary px-4 py-2 text-sm"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
