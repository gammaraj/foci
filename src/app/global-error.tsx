"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { FociDot } from "@/components/FociDot";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "#0a0f1a",
          color: "#e2e8f0",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
            textAlign: "center",
          }}
        >
          <div style={{ color: "#60a5fa", marginBottom: "1.25rem" }}>
            <FociDot mood="worried" size={80} />
          </div>
          <h2 style={{ margin: "0 0 0.75rem", fontSize: "1.5rem", fontWeight: 700 }}>
            Dot lost focus for a second
          </h2>
          <p style={{ margin: "0 0 0.5rem", maxWidth: "28rem", color: "#94a3b8" }}>
            We&apos;ve been notified and will fix this as soon as possible. Please try
            refreshing the page.
          </p>
        </div>
      </body>
    </html>
  );
}
