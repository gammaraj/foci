const PRODUCTION_HOSTS = new Set(["usefoci.com", "www.usefoci.com"]);

function hostnameFromHostHeader(host: string | null | undefined): string | null {
  if (!host) return null;
  const first = host.trim().split(",")[0]?.trim() ?? "";
  if (!first || first.includes("/") || first.includes("@") || first.includes("\\")) {
    return null;
  }
  const hostname = first.split(":")[0]?.toLowerCase() ?? "";
  return hostname || null;
}

export function isLocalHostname(hostname: string | null | undefined): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

function vercelDeploymentHostnames(): Set<string> {
  const hosts = new Set<string>();
  for (const raw of [
    process.env.VERCEL_URL,
    process.env.VERCEL_BRANCH_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
  ]) {
    if (!raw) continue;
    try {
      const host = raw.includes("://") ? new URL(raw).hostname : hostnameFromHostHeader(raw);
      if (host) hosts.add(host);
    } catch {
      /* ignore malformed env */
    }
  }
  return hosts;
}

export function isTrustedHostname(hostname: string | null | undefined): boolean {
  if (!hostname) return false;
  if (PRODUCTION_HOSTS.has(hostname)) return true;
  if (isLocalHostname(hostname)) return true;
  return vercelDeploymentHostnames().has(hostname);
}

/** Host header we will follow for HTTPS redirects. Never reflects untrusted Host values. */
export function trustedRedirectHostname(hostHeader: string | null | undefined): string {
  const hostname = hostnameFromHostHeader(hostHeader);
  if (hostname && isTrustedHostname(hostname)) return hostname;
  return "usefoci.com";
}

export const PRODUCTION_ORIGIN = "https://usefoci.com";

/**
 * Post-auth redirect origin. Ignores X-Forwarded-Host and only allows
 * usefoci.com, localhost, or this Vercel deployment.
 */
export function trustedOriginFromRequest(request: Request): string {
  let hostname: string | null = null;
  let port = "";
  try {
    const url = new URL(request.url);
    hostname = url.hostname.toLowerCase();
    port = url.port;
  } catch {
    hostname = hostnameFromHostHeader(request.headers.get("host"));
  }

  if (!hostname || !isTrustedHostname(hostname)) {
    return PRODUCTION_ORIGIN;
  }

  if (isLocalHostname(hostname)) {
    const proto = request.headers.get("x-forwarded-proto") === "https" ? "https" : "http";
    const suffix = port && port !== "80" && port !== "443" ? `:${port}` : "";
    return `${proto}://${hostname}${suffix}`;
  }

  return `https://${hostname}`;
}
