import Link from "next/link";
import { allCompareLandings } from "@/lib/compare-landings";

export default function CompareHubLinks({ className = "" }: { className?: string }) {
  const pages = allCompareLandings();
  return (
    <nav aria-label="Comparisons and alternatives" className={className}>
      <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
        Compare Foci
      </h2>
      <ul className="flex flex-wrap gap-x-4 gap-y-2">
        {pages.map((page) => {
          const href = page.kind === "vs" ? `/vs/${page.slug}` : `/alternatives/${page.slug}`;
          return (
            <li key={href}>
              <Link
                href={href}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                {page.h1}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
