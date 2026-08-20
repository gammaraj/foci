import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { isLocalHostname, isTrustedHostname, trustedRedirectHostname } from "@/lib/trusted-origin";

const isDev = process.env.NODE_ENV === "development";

function hostnameOf(host: string | null): string | null {
  if (!host) return null;
  return host.split(":")[0]?.toLowerCase() ?? null;
}

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie.name, cookie.value);
  });
}

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto");
  const hostname = hostnameOf(host);
  if (!isDev && !isLocalHostname(hostname) && proto === "http") {
    const redirectHost = trustedRedirectHostname(host);
    const dest = `https://${redirectHost}${request.nextUrl.pathname}${request.nextUrl.search}`;
    return NextResponse.redirect(dest, 301);
  }
  if (!isDev && hostname && !isLocalHostname(hostname) && !isTrustedHostname(hostname)) {
    return new NextResponse("Invalid host", { status: 400 });
  }

  const { response: sessionResponse, user } = await updateSession(request);

  // Generate a per-request nonce for CSP
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}'${isDev ? " 'unsafe-eval'" : ""} https://www.googletagmanager.com`,
    `worker-src 'self' blob:`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob: https://*.googleusercontent.com https://www.google-analytics.com https://www.googletagmanager.com`,
    `font-src 'self'`,
    `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com`,
    `frame-src https://www.youtube.com https://open.spotify.com https://w.soundcloud.com`,
    `frame-ancestors 'none'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    ...(isDev ? [] : [`upgrade-insecure-requests`]),
  ].join("; ");

  // Signed-in users skip the marketing homepage → go straight to the app
  if (user && request.nextUrl.pathname === "/") {
    const dest = request.nextUrl.clone();
    dest.pathname = "/app";
    const redirectResponse = NextResponse.redirect(dest);
    copyCookies(sessionResponse, redirectResponse);
    redirectResponse.headers.set("Content-Security-Policy", csp);
    redirectResponse.headers.set("x-nonce", nonce);
    return redirectResponse;
  }

  sessionResponse.headers.set("Content-Security-Policy", csp);
  sessionResponse.headers.set("x-nonce", nonce);

  return sessionResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    "/((?!_next/static|_next/image|favicon\\.ico|sw\\.js|manifest\\.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
