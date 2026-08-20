import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { trustedOriginFromRequest } from "@/lib/trusted-origin";

const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 10;

export async function GET(request: Request) {
  const ip = getClientIp(request.headers);
  if ((await rateLimit(`auth-callback:${ip}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW)).limited) {
    return new NextResponse("Too many requests", { status: 429 });
  }

  const origin = trustedOriginFromRequest(request);
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
