"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

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
          <img
            src="/images/busy-beaver-stud.png"
            alt="Busy the Beaver looking concerned"
            width={140}
            height={140}
            style={{ display: "block", margin: "0 auto 1.25rem" }}
          />
          <h2 style={{ margin: "0 0 0.75rem", fontSize: "1.5rem", fontWeight: 700 }}>
            Busy lost focus for a second
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
