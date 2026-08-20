import type { Metadata } from "next";
import { NotFoundView } from "@/components/NotFoundView";
import { absolutePageTitle } from "@/lib/site-metadata";

export const metadata: Metadata = {
  title: absolutePageTitle("Page Not Found"),
  description: "The page you're looking for doesn't exist. Head back to Foci to start focusing.",
};

export default function NotFound() {
  return <NotFoundView />;
}
