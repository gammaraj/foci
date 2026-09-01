"use client";

import { useEffect } from "react";
import { reportError } from "@/lib/report-error";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    reportError("Global error", error, { digest: error.digest });
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
            alt="Beavy the Beaver looking concerned"
            width={140}
            height={140}
            style={{ display: "block", margin: "0 auto 1.25rem" }}
          />
          <h2 style={{ margin: "0 0 0.75rem", fontSize: "1.5rem", fontWeight: 700 }}>
            Beavy dropped a log on this page
          </h2>
          <p style={{ margin: "0 0 0.5rem", maxWidth: "28rem", color: "#94a3b8" }}>
            We&apos;ve been notified. Give it another chew — try refreshing.
          </p>
        </div>
      </body>
    </html>
  );
}
