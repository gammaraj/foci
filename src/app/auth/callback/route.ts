import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 10;
const PRODUCTION_ORIGIN = "https://usefoci.com";

function getSiteOrigin(request: Request): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host");
  if (host) {
    const proto = request.headers.get("x-forwarded-proto") ?? "https";
    return `${proto}://${host}`;
  }
  try {
    return new URL(request.url).origin;
  } catch {
    return PRODUCTION_ORIGIN;
  }
}

export async function GET(request: Request) {
  const ip = getClientIp(request.headers);
  if ((await rateLimit(`auth-callback:${ip}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW)).limited) {
    return new NextResponse("Too many requests", { status: 429 });
  }

  const origin = getSiteOrigin(request);
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/app`);
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
