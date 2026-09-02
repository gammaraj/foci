"use client";

import React from "react";
import { BusyBeaver } from "@/components/BusyBeaver";
import { reportError } from "@/lib/report-error";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

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
    reportError("Uncaught error", error, { componentStack: info.componentStack });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <EmptyState
            title="Beavy dropped a log on this page"
            body="Something unexpected floated downstream. Try refreshing."
            illustration={
              <BusyBeaver alt="Beavy the Beaver looking concerned" size={96} className="mx-auto" />
            }
            action={
              <Button onClick={() => this.setState({ hasError: false })}>Try again</Button>
            }
          />
        </div>
      );
    }

    return this.props.children;
  }
}
