import { redirect } from "next/navigation";
import { isTaskViewSegment } from "@/lib/task-view-url";

/**
 * Validates `/app/cards`-style segments. Workspace UI lives in the parent layout.
 * Never 404 under /app — junk paths (e.g. `/app/cards/1`, `/app/nope`) redirect so
 * the app shell stays mounted and logo/nav clicks keep working.
 */
export default async function AppViewPage({
  params,
}: {
  params: Promise<{ view?: string[] }>;
}) {
  const { view } = await params;
  if (!view || view.length === 0) return null;

  const [segment] = view;
  if (!isTaskViewSegment(segment)) {
    redirect("/app/cards");
  }

  // `/app/cards/1` (and similar) — keep the layout view, drop junk trailing segments.
  if (view.length > 1) {
    redirect(`/app/${segment}`);
  }

  return null;
}
