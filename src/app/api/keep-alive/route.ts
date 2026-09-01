import { NextRequest, NextResponse } from "next/server";
import { pingPostgrest } from "@/lib/postgrest-ping";
import { reportError } from "@/lib/report-error";

/** Lightweight DB ping for Vercel cron / GitHub Actions — prevents Supabase free-tier pause. */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await pingPostgrest();
  if (!result.ok) {
    reportError("keep-alive ping failed", result.error, {
      attempts: result.attempts,
      latencyMs: result.latencyMs,
    });
    return NextResponse.json(
      {
        error: result.error ?? "keep_alive_failed",
        attempts: result.attempts,
        latencyMs: result.latencyMs,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    attempts: result.attempts,
    latencyMs: result.latencyMs,
    timestamp: new Date().toISOString(),
  });
}
