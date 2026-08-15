const POSTGREST_TIMEOUT_MS = 10_000;
const DEFAULT_ATTEMPTS = 3;
const RETRY_DELAY_MS = 400;

export type PostgrestPing = {
  ok: boolean;
  latencyMs: number;
  attempts: number;
  error?: string;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Lightweight PostgREST probe with retries for transient gateway / DB blips. */
export async function pingPostgrest(
  attempts: number = DEFAULT_ATTEMPTS,
): Promise<PostgrestPing> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return { ok: false, latencyMs: 0, attempts: 0, error: "missing_supabase_config" };
  }

  const url = `${supabaseUrl.replace(/\/$/, "")}/rest/v1/tasks?select=id&limit=1`;
  const started = Date.now();
  let lastError = "request_failed";

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(POSTGREST_TIMEOUT_MS),
        cache: "no-store",
      });

      if (res.ok) {
        return { ok: true, latencyMs: Date.now() - started, attempts: attempt };
      }

      lastError = `http_${res.status}`;
    } catch (err) {
      lastError = err instanceof Error ? err.message : "request_failed";
    }

    if (attempt < attempts) {
      await sleep(RETRY_DELAY_MS * attempt);
    }
  }

  return {
    ok: false,
    latencyMs: Date.now() - started,
    attempts,
    error: lastError,
  };
}
