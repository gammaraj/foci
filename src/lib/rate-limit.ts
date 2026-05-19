/**
 * Rate limiting for API routes and auth callbacks.
 * Uses Upstash Redis when UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set;
 * otherwise falls back to an in-memory limiter (per serverless instance).
 */

type RateLimitResult = { limited: boolean };

interface RateLimiter {
  check(key: string, limit: number, windowMs: number): Promise<RateLimitResult>;
}

const memoryStore = new Map<string, { count: number; resetAt: number }>();

const memoryLimiter: RateLimiter = {
  async check(key, limit, windowMs) {
    const now = Date.now();
    const entry = memoryStore.get(key);

    if (!entry || now > entry.resetAt) {
      if (memoryStore.size > 10_000) {
        for (const [k, val] of memoryStore) {
          if (now > val.resetAt) memoryStore.delete(k);
        }
      }
      memoryStore.set(key, { count: 1, resetAt: now + windowMs });
      return { limited: false };
    }

    entry.count++;
    return { limited: entry.count > limit };
  },
};

let upstashLimiter: RateLimiter | null = null;
let upstashInitAttempted = false;

async function getUpstashLimiter(): Promise<RateLimiter | null> {
  if (upstashInitAttempted) return upstashLimiter;
  upstashInitAttempted = true;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  try {
    const { Ratelimit } = await import("@upstash/ratelimit");
    const { Redis } = await import("@upstash/redis");
    const redis = new Redis({ url, token });

    const limiters = new Map<string, InstanceType<typeof Ratelimit>>();

    upstashLimiter = {
      async check(key, limit, windowMs) {
        const configKey = `${windowMs}:${limit}`;
        let rl = limiters.get(configKey);
        if (!rl) {
          const windowSec = Math.max(1, Math.round(windowMs / 1000));
          rl = new Ratelimit({
            redis,
            limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
            prefix: "foci-rl",
          });
          limiters.set(configKey, rl);
        }
        const result = await rl.limit(`${key}:${configKey}`);
        return { limited: !result.success };
      },
    };
    return upstashLimiter;
  } catch {
    return null;
  }
}

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const upstash = await getUpstashLimiter();
  const limiter = upstash ?? memoryLimiter;
  return limiter.check(key, limit, windowMs);
}

/** Extract client IP from request headers (rightmost X-Forwarded-For on Vercel). */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",").at(-1)!.trim();
  return headers.get("x-real-ip") ?? "unknown";
}
