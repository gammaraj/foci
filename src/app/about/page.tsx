import type { Metadata } from "next";
import Link from "next/link";
import AppNavbar from "@/components/AppNavbar";
import GuideLinkHub from "@/components/GuideLinkHub";
import { absolutePageTitle } from "@/lib/site-metadata";
import { FOCI_TAGLINE_CALM } from "@/lib/logo-brand";

const siteUrl = "https://usefoci.com";
const title = "About Foci — Free Focus Timer & Task App";
const description =
  "Foci is a free focus system: Pomodoro timer, tasks, ambient sounds, and streaks in one calm browser window. Built for students, developers, and deep work — worldwide, no signup required.";

export const metadata: Metadata = {
  title: absolutePageTitle(title),
  description,
  alternates: { canonical: "/about" },
  openGraph: {
    title,
    description,
    url: `${siteUrl}/about`,
    type: "website",
    siteName: "Foci",
    images: [{ url: `${siteUrl}/opengraph-image`, width: 1200, height: 630, alt: "Foci" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [`${siteUrl}/twitter-image`],
  },
};

function safeJsonLd(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}

const aboutJsonLd = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: title,
  url: `${siteUrl}/about`,
  description,
  mainEntity: {
    "@type": "Organization",
    name: "Foci",
    url: siteUrl,
    logo: `${siteUrl}/logo.svg`,
    sameAs: ["https://twitter.com/usefoci"],
    description:
      "Foci builds a free all-in-one focus system: Pomodoro timer, task tracking, Smart Plan, ambient music, and streak stats — available worldwide at usefoci.com.",
    areaServed: { "@type": "Place", name: "Worldwide" },
    knowsLanguage: "en",
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0a0f1a]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(aboutJsonLd) }}
      />
      <AppNavbar />

      <main className="flex-1 app-container py-12 sm:py-16">
        <article className="max-w-2xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-3">
            About
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
            Foci — {FOCI_TAGLINE_CALM}
          </h1>
          <p className="mt-5 text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
            Foci is a free focus system for people who want one calm window for deep work:
            timer, tasks, ambient sound, and streaks — without juggling five apps.
          </p>

          <section className="mt-10 space-y-4 text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Why we built Foci</h2>
            <p>
              Most “focus” tools are either a bare countdown or a heavy task manager. Switching
              between them breaks concentration. Foci puts a task list, Smart Plan scheduling,
              offline ambient sounds (including brown noise), and an optional focus timer in one
              browser tab so you can start work in seconds.
            </p>
            <p>
              A free account keeps tasks, settings, and streaks synced across devices — useful
              when you move between laptop and phone.
            </p>
          </section>

          <section className="mt-10 space-y-4 text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Who Foci is for</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Students who need a study timer with brown noise and session goals</li>
              <li>Developers and writers protecting flow (Pomodoro, Flowtime, or 52/17)</li>
              <li>Remote and knowledge workers who want tasks and focus in one place</li>
              <li>Anyone looking for ADHD-friendly external structure without a paywall</li>
            </ul>
          </section>

          <section className="mt-10 space-y-4 text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Privacy by default</h2>
            <p>
              Your account data syncs via Supabase. No ads. No selling personal focus data.
              Read the{" "}
              <Link href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">
                Privacy Policy
              </Link>{" "}
              and{" "}
              <Link href="/terms" className="text-blue-600 dark:text-blue-400 hover:underline">
                Terms of Use
              </Link>
              . Foci is available worldwide in English at{" "}
              <a href={siteUrl} className="text-blue-600 dark:text-blue-400 hover:underline">
                usefoci.com
              </a>
              .
            </p>
          </section>

          <section className="mt-10 space-y-4 text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Learn more</h2>
            <ul className="space-y-2">
              <li>
                <Link href="/app" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Open the free app
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Focus & productivity guides
                </Link>
              </li>
              <li>
                <Link href="/blog/best-free-pomodoro-apps-2026" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Best free Pomodoro apps 2026
                </Link>
              </li>
              <li>
                <a
                  href="https://twitter.com/usefoci"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  @usefoci on X
                </a>
              </li>
            </ul>
          </section>

          <div className="mt-12 flex flex-col sm:flex-row gap-3">
            <Link
              href="/app"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm transition-colors"
            >
              Try Foci — free
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-sm hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
            >
              Create free account to sync
            </Link>
          </div>
        </article>

        <div className="max-w-6xl mx-auto mt-16">
          <GuideLinkHub />
        </div>
      </main>

      <footer className="py-8 px-4 text-center border-t border-slate-200 dark:border-slate-800">
        <GuideLinkHub variant="footer" className="mb-4" />
        <p className="text-sm text-slate-400 dark:text-slate-600">
          <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400">
            Home
          </Link>
          {" · "}
          <Link href="/privacy" className="hover:text-blue-600 dark:hover:text-blue-400">
            Privacy
          </Link>
          {" · "}
          <Link href="/terms" className="hover:text-blue-600 dark:hover:text-blue-400">
            Terms
          </Link>
          {" · "}
          Built for focus.
        </p>
      </footer>
    </div>
  );
}
