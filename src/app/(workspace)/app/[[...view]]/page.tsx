import { notFound } from "next/navigation";
import { isTaskViewSegment } from "@/lib/task-view-url";
import AppPageClient from "./AppPageClient";

export default async function AppViewPage({
  params,
}: {
  params: Promise<{ view?: string[] }>;
}) {
  const { view } = await params;
  if (view && view.length > 0 && (view.length > 1 || !isTaskViewSegment(view[0]))) {
    notFound();
  }
  return <AppPageClient />;
}
