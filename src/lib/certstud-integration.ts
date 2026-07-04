export const CERTSTUD_CONTEXT_KEY = "foci_certstud_context";
export const CERTSTUD_DISMISS_KEY = "foci_certstud_promo_dismissed";
export const CERTSTUD_BASE_URL = "https://certstud.com";
export const CERTSTUD_PROJECT_PREFIX = "CertStud:";

export interface CertStudDeepLinkParams {
  ref?: string;
  source?: string;
  cert?: string;
  certCode?: string;
  topic?: string;
  duration?: string;
  returnUrl?: string;
}

export interface CertStudContext {
  ref?: string;
  certId?: string;
  certCode?: string;
  topic?: string;
  returnUrl?: string;
  source?: string;
}

export function isCertStudInboundLink(searchParams: URLSearchParams): boolean {
  return (
    searchParams.get("source") === "certstud" ||
    !!searchParams.get("cert") ||
    !!searchParams.get("cert_code") ||
    !!searchParams.get("return_url")
  );
}

export function parseCertStudParams(
  searchParams: URLSearchParams
): CertStudDeepLinkParams & { isCertStudDeepLink: boolean } {
  const params: CertStudDeepLinkParams = {
    ref: searchParams.get("ref") ?? undefined,
    source: searchParams.get("source") ?? undefined,
    cert: searchParams.get("cert") ?? undefined,
    certCode: searchParams.get("cert_code") ?? undefined,
    topic: searchParams.get("topic") ?? undefined,
    duration: searchParams.get("duration") ?? undefined,
    returnUrl: searchParams.get("return_url") ?? undefined,
  };

  return {
    ...params,
    isCertStudDeepLink: isCertStudInboundLink(searchParams),
  };
}

export function parseDurationMinutes(duration?: string): number | null {
  if (!duration) return null;
  const minutes = parseInt(duration, 10);
  if (!Number.isFinite(minutes) || minutes < 1 || minutes > 180) return null;
  return minutes;
}

export function buildCertStudProjectName(
  params: Pick<CertStudDeepLinkParams, "certCode" | "cert">
): string {
  const label = params.certCode || params.cert || "Study";
  return `${CERTSTUD_PROJECT_PREFIX} ${label}`;
}

export function buildCertStudTaskTitle(
  params: Pick<CertStudDeepLinkParams, "certCode" | "cert" | "topic">
): string {
  const label = params.certCode || params.cert || "certification";
  if (params.topic) return `Study ${label}: ${params.topic}`;
  return `Study ${label}`;
}

export function toCertStudContext(params: CertStudDeepLinkParams): CertStudContext {
  return {
    ref: params.ref,
    certId: params.cert,
    certCode: params.certCode,
    topic: params.topic,
    returnUrl: params.returnUrl,
    source: params.source,
  };
}

export function saveCertStudContext(context: CertStudContext): void {
  try {
    sessionStorage.setItem(CERTSTUD_CONTEXT_KEY, JSON.stringify(context));
  } catch {
    /* ignore quota / private mode */
  }
}

export function loadCertStudContext(): CertStudContext | null {
  try {
    const raw = sessionStorage.getItem(CERTSTUD_CONTEXT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CertStudContext;
  } catch {
    return null;
  }
}

export function certStudPracticeUrl(context: CertStudContext): string {
  if (context.returnUrl) return context.returnUrl;

  const ref = encodeURIComponent(context.ref ?? "foci-app");
  if (context.certId) {
    return `${CERTSTUD_BASE_URL}/certifications?utm_source=foci&ref=${ref}`;
  }

  return `${CERTSTUD_BASE_URL}/certifications?ref=foci`;
}

export function certStudLinkLabel(context: CertStudContext): string {
  const label = context.certCode || context.certId;
  if (label && context.topic) return `Continue ${label}: ${context.topic} on CertStud`;
  if (label) return `Continue ${label} practice on CertStud`;
  return "Continue studying on CertStud";
}
