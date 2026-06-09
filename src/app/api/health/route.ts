import { NextResponse } from "next/server";

const POSTGREST_TIMEOUT_MS = 10_000;

type PostgrestCheck = {
  ok: boolean;
  latencyMs: number;
  error?: string;
};

async function checkPostgrest(): Promise<PostgrestCheck> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return { ok: false, latencyMs: 0, error: "missing_supabase_config" };
  }

  const started = Date.now();
  try {
    const res = await fetch(
      `${supabaseUrl.replace(/\/$/, "")}/rest/v1/tasks?select=id&limit=1`,
      {
        method: "GET",
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(POSTGREST_TIMEOUT_MS),
        cache: "no-store",
      },
    );

    const latencyMs = Date.now() - started;
    if (res.ok) {
      return { ok: true, latencyMs };
    }

    return { ok: false, latencyMs, error: `http_${res.status}` };
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - started,
      error: err instanceof Error ? err.message : "request_failed",
    };
  }
}

function healthResponse(postgrest: PostgrestCheck, method: "GET" | "HEAD") {
  const status = postgrest.ok ? "ok" : "degraded";
  const httpStatus = postgrest.ok ? 200 : 503;
  const headers = {
    "Cache-Control": "no-store",
    "Content-Type": "application/json",
  };

  if (method === "HEAD") {
    return new NextResponse(null, { status: httpStatus, headers });
  }

  return NextResponse.json(
    {
      status,
      checks: { postgrest },
      timestamp: new Date().toISOString(),
    },
    { status: httpStatus, headers },
  );
}

/** Probes Supabase PostgREST — use for uptime monitoring (UptimeRobot, Better Stack, etc.). */
export async function GET() {
  const postgrest = await checkPostgrest();
  return healthResponse(postgrest, "GET");
}

export async function HEAD() {
  const postgrest = await checkPostgrest();
  return healthResponse(postgrest, "HEAD");
}
