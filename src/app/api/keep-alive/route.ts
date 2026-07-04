import { NextRequest, NextResponse } from "next/server";

const POSTGREST_TIMEOUT_MS = 10_000;

async function pingSupabase(): Promise<{ ok: boolean; error?: string }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return { ok: false, error: "missing_supabase_config" };
  }

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

    if (res.ok) return { ok: true };
    return { ok: false, error: `http_${res.status}` };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "request_failed",
    };
  }
}

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

  const result = await pingSupabase();
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "keep_alive_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, timestamp: new Date().toISOString() });
}
