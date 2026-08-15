import { NextResponse } from "next/server";
import { pingPostgrest, type PostgrestPing } from "@/lib/postgrest-ping";

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

/** Probes Supabase PostgREST — use for uptime monitoring (UptimeRobot, Better Stack, etc.). */
export async function GET() {
  const postgrest = await pingPostgrest();
  return healthResponse(postgrest, "GET");
}

export async function HEAD() {
  const postgrest = await pingPostgrest();
  return healthResponse(postgrest, "HEAD");
}
