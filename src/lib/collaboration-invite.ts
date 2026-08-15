/** Honest invite helpers — Foci stores invites in-app; it does not send email yet. */

export const FOCI_APP_URL = "https://usefoci.com/app";

export function buildProjectInviteMessage(opts: {
  projectName: string;
  inviteeEmail: string;
  role: "editor" | "viewer";
}): string {
  const access = opts.role === "editor" ? "can edit" : "view only";
  return [
    `I've shared the Foci project "${opts.projectName}" with you (${access}).`,
    "",
    `1. Open ${FOCI_APP_URL}`,
    `2. Sign in with ${opts.inviteeEmail}`,
    `3. Tap the people icon → accept the invite`,
    "",
    "— via Foci",
  ].join("\n");
}

export function buildAccountInviteMessage(opts: {
  inviteeEmail: string;
  role: "editor" | "viewer";
}): string {
  const access = opts.role === "editor" ? "can edit" : "view only";
  return [
    `I've shared my Foci account with you (${access} — all current and future projects).`,
    "",
    `1. Open ${FOCI_APP_URL}`,
    `2. Sign in with ${opts.inviteeEmail}`,
    `3. Tap the people icon → accept the invite`,
    "",
    "— via Foci",
  ].join("\n");
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}
