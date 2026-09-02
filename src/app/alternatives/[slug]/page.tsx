import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import AppNavbar from "@/components/AppNavbar";
import CompareLandingView from "@/components/CompareLandingView";
import GuideLinkHub from "@/components/GuideLinkHub";
import { FilantusInContentPromo } from "@/components/FilantusCrossPromoBanner";
import { absolutePageTitle } from "@/lib/site-metadata";
import { ALTERNATIVES_LANDINGS, getAlternativesLanding } from "@/lib/compare-landings";
import { SITE_URL } from "@/lib/product-facts";

export function generateStaticParams() {
  return ALTERNATIVES_LANDINGS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = getAlternativesLanding(slug);
  if (!page) return {};
  const url = `${SITE_URL}/alternatives/${page.slug}`;
  return {
    title: absolutePageTitle(page.title),
    description: page.description,
    alternates: { canonical: `/alternatives/${page.slug}` },
    openGraph: {
      title: page.title,
      description: page.description,
      url,
      type: "website",
      siteName: "Foci",
      images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: "Foci" }],
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
      images: [`${SITE_URL}/twitter-image`],
    },
  };
}

export default async function AlternativesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = getAlternativesLanding(slug);
  if (!page) notFound();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-page">
      <AppNavbar />
      <main className="flex-1 app-container py-12 sm:py-16">
        <CompareLandingView page={page} />
        <FilantusInContentPromo />
        <div className="max-w-6xl mx-auto mt-16">
          <GuideLinkHub />
        </div>
      </main>
      <footer className="py-8 px-4 text-center border-t border-slate-200 dark:border-slate-800">
        <GuideLinkHub variant="footer" className="mb-4" />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400">
            Home
          </Link>
          {" · "}
          <Link href="/blog" className="hover:text-blue-600 dark:hover:text-blue-400">
            Blog
          </Link>
          {" · "}
          <Link href="/about" className="hover:text-blue-600 dark:hover:text-blue-400">
            About
          </Link>
          {" · "}
          <Link href="/contact" className="hover:text-blue-600 dark:hover:text-blue-400">
            Contact
          </Link>
          {" · "}
          <Link href="/privacy" className="hover:text-blue-600 dark:hover:text-blue-400">
            Privacy
          </Link>
        </p>
      </footer>
    </div>
  );
}
