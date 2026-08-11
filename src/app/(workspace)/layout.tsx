"use client";

import WorkspaceChrome from "@/components/WorkspaceChrome";

/** Keeps timer/music mounted across /app ↔ /stats navigation. */
export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return <WorkspaceChrome>{children}</WorkspaceChrome>;
}
