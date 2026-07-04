export const BOOSTLOGIK_CONTEXT_KEY = "foci_boostlogik_context";
export const BOOSTLOGIK_DISMISS_KEY = "foci_boostlogik_promo_dismissed";
export const BOOSTLOGIK_BASE_URL = "https://boostlogik.com";
export const BOOSTLOGIK_PROJECT_PREFIX = "BoostLogik:";

export interface BoostLogikDeepLinkParams {
  ref?: string;
  source?: string;
  projectId?: string;
  projectName?: string;
  task?: string;
  duration?: string;
  returnUrl?: string;
}

export interface BoostLogikContext {
  ref?: string;
  projectId?: string;
  projectName?: string;
  task?: string;
  returnUrl?: string;
  source?: string;
}

export function isBoostLogikInboundLink(searchParams: URLSearchParams): boolean {
  if (searchParams.get("source") === "certstud") return false;
  return (
    searchParams.get("source") === "boostlogik" ||
    !!searchParams.get("project_name")
  );
}

export function parseBoostLogikParams(
  searchParams: URLSearchParams
): BoostLogikDeepLinkParams & { isBoostLogikDeepLink: boolean } {
  const params: BoostLogikDeepLinkParams = {
    ref: searchParams.get("ref") ?? undefined,
    source: searchParams.get("source") ?? undefined,
    projectId: searchParams.get("project_id") ?? undefined,
    projectName: searchParams.get("project_name") ?? undefined,
    task: searchParams.get("task") ?? undefined,
    duration: searchParams.get("duration") ?? undefined,
    returnUrl: searchParams.get("return_url") ?? undefined,
  };

  return {
    ...params,
    isBoostLogikDeepLink: isBoostLogikInboundLink(searchParams),
  };
}

export function parseDurationMinutes(duration?: string): number | null {
  if (!duration) return null;
  const minutes = parseInt(duration, 10);
  if (!Number.isFinite(minutes) || minutes < 1 || minutes > 180) return null;
  return minutes;
}

export function buildBoostLogikProjectName(
  params: Pick<BoostLogikDeepLinkParams, "projectName">
): string {
  const label = params.projectName?.trim() || "SEO Project";
  return `${BOOSTLOGIK_PROJECT_PREFIX} ${label}`;
}

export function buildBoostLogikTaskTitle(
  params: Pick<BoostLogikDeepLinkParams, "task" | "projectName">
): string {
  if (params.task?.trim()) return params.task.trim();
  const label = params.projectName?.trim() || "project";
  return `Work on ${label} SEO tasks`;
}

export function toBoostLogikContext(params: BoostLogikDeepLinkParams): BoostLogikContext {
  return {
    ref: params.ref,
    projectId: params.projectId,
    projectName: params.projectName,
    task: params.task,
    returnUrl: params.returnUrl,
    source: params.source,
  };
}

export function saveBoostLogikContext(context: BoostLogikContext): void {
  try {
    sessionStorage.setItem(BOOSTLOGIK_CONTEXT_KEY, JSON.stringify(context));
  } catch {
    /* ignore quota / private mode */
  }
}

export function loadBoostLogikContext(): BoostLogikContext | null {
  try {
    const raw = sessionStorage.getItem(BOOSTLOGIK_CONTEXT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as BoostLogikContext;
  } catch {
    return null;
  }
}

export function boostLogikReturnUrl(context: BoostLogikContext): string {
  if (context.returnUrl) return context.returnUrl;

  const ref = encodeURIComponent(context.ref ?? "foci-app");
  if (context.projectId) {
    return `${BOOSTLOGIK_BASE_URL}/dashboard/projects/${context.projectId}?ref=${ref}`;
  }

  return `${BOOSTLOGIK_BASE_URL}/dashboard?ref=foci`;
}

export function boostLogikLinkLabel(context: BoostLogikContext): string {
  const label = context.projectName;
  if (label && context.task) return `Continue ${label}: ${context.task} on BoostLogik`;
  if (label) return `Return to ${label} on BoostLogik`;
  return "Continue on BoostLogik";
}
