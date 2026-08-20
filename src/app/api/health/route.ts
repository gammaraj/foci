import { NextResponse } from "next/server";
import { pingPostgrest, type PostgrestPing } from "@/lib/postgrest-ping";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 30;
const PING_CACHE_MS = 15_000;

let cachedPing: { at: number; result: PostgrestPing } | null = null;

async function cachedPostgrestPing(): Promise<PostgrestPing> {
  if (cachedPing && Date.now() - cachedPing.at < PING_CACHE_MS) {
    return cachedPing.result;
  }
  const result = await pingPostgrest();
  cachedPing = { at: Date.now(), result };
  return result;
}

function healthResponse(postgrest: PostgrestPing, method: "GET" | "HEAD") {
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

async function guardedHealth(request: Request, method: "GET" | "HEAD") {
  const ip = getClientIp(request.headers);
  if ((await rateLimit(`health:${ip}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW)).limited) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const postgrest = await cachedPostgrestPing();
  return healthResponse(postgrest, method);
}

/** Probes Supabase PostgREST — use for uptime monitoring (UptimeRobot, Better Stack, etc.). */
export async function GET(request: Request) {
  return guardedHealth(request, "GET");
}

export async function HEAD(request: Request) {
  return guardedHealth(request, "HEAD");
}
