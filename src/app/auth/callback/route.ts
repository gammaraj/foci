import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Simple in-memory rate limiter: max 10 requests per IP per 60 seconds
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 10;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    // Periodic cleanup to prevent unbounded growth
    if (rateLimitMap.size > 10_000) {
      for (const [key, val] of rateLimitMap) {
        if (now > val.resetAt) rateLimitMap.delete(key);
      }
    }
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

const SITE_ORIGIN = "https://usefoci.com";

export async function GET(request: Request) {
  // Use the rightmost IP added by the trusted Vercel proxy, not the
  // leftmost (which can be spoofed by the client).
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",").at(-1)!.trim() : "unknown";
  if (isRateLimited(ip)) {
    return new NextResponse("Too many requests", { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${SITE_ORIGIN}/app`);
    }
  }

  // Return to login page on error
  return NextResponse.redirect(`${SITE_ORIGIN}/login`);
}
