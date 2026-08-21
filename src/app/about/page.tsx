import type { Metadata } from "next";
import Link from "next/link";
import AppNavbar from "@/components/AppNavbar";
import { BusyBeaver } from "@/components/BusyBeaver";
import GuideLinkHub from "@/components/GuideLinkHub";
import { absolutePageTitle } from "@/lib/site-metadata";
import { FOCI_TAGLINE_CALM } from "@/lib/logo-brand";
import {
  SITE_URL,
  FOCI_ONE_LINER,
  FOCI_ACCOUNT_POLICY,
  FOCI_SAME_AS,
  PRODUCT_DATE_MODIFIED,
  CONTACT_EMAIL,
} from "@/lib/product-facts";

const siteUrl = SITE_URL;
const title = "About Foci App — Free Focus Timer & Tasks";
const description =
  "Foci (usefoci.com) is a free browser focus app — Pomodoro/Flowtime timer, tasks, Smart Plan, ambient sounds, and streaks. Not a wearable or crypto. No signup required to start.";

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
  dateModified: PRODUCT_DATE_MODIFIED,
  mainEntity: {
    "@type": "Organization",
    name: "Foci",
    url: siteUrl,
    logo: `${siteUrl}/logo.svg`,
    sameAs: [...FOCI_SAME_AS],
    email: CONTACT_EMAIL,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: CONTACT_EMAIL,
      url: `${siteUrl}/contact`,
      availableLanguage: "English",
    },
    description: FOCI_ONE_LINER,
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
          <div className="flex justify-center mb-5">
            <BusyBeaver alt="Beavy the Beaver — Foci mascot" size={112} priority />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-3">
            About
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
            Foci — {FOCI_TAGLINE_CALM}
          </h1>
          <p className="mt-5 text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
            {FOCI_ONE_LINER}
          </p>

          <section className="mt-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/40 p-5 space-y-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Product facts</h2>
            <ul className="space-y-2">
              <li>
                <strong className="text-slate-800 dark:text-slate-200">Product:</strong> Foci
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">URL:</strong>{" "}
                <a href={siteUrl} className="text-blue-600 dark:text-blue-400 hover:underline">
                  usefoci.com
                </a>
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">Price:</strong> Free (no credit card)
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">Account:</strong>{" "}
                {FOCI_ACCOUNT_POLICY}
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">Mascot:</strong> Beavy the
                Beaver — dam proud of finished tasks
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">Audience:</strong> Students,
                developers, writers, and knowledge workers worldwide
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">Last updated:</strong>{" "}
                {PRODUCT_DATE_MODIFIED}
              </li>
            </ul>
          </section>

          <section className="mt-10 space-y-4 text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Why we built Foci</h2>
            <p>
              Most “focus” tools are either a bare countdown or a heavy task manager. Switching
              between them breaks concentration. Foci puts a task list, Smart Plan scheduling,
              offline ambient sounds (including brown noise), and an optional focus timer in one
              browser tab so you can start work in seconds.
            </p>
            <p>
              Our mascot is Beavy the Beaver — paddle tail, tiny arms, big energy. Beavy
              cheers when you finish a task, looks a little wilted after quiet days, and shows
              up if a page goes missing (usually with woodchips).
            </p>
            <p>
              A free account keeps tasks, settings, and streaks synced across devices — useful
              when you move between laptop and phone. You can try the full app first without signing
              in.
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
              Your account data syncs via Supabase. We do not sell personal focus data. Display ads,
              if shown, appear on public marketing and blog pages — not inside the focus workspace. Read
              the{" "}
              <Link href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">
                Privacy Policy
              </Link>
              ,{" "}
              <Link href="/terms" className="text-blue-600 dark:text-blue-400 hover:underline">
                Terms of Use
              </Link>
              , or{" "}
              <Link href="/contact" className="text-blue-600 dark:text-blue-400 hover:underline">
                Contact
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
                <Link href="/vs/forest" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Foci vs Forest
                </Link>
              </li>
              <li>
                <Link href="/alternatives/pomodoro-apps" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Best free Pomodoro apps
                </Link>
              </li>
              <li>
                <Link href="/blog/best-free-pomodoro-apps-2026" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Best free Pomodoro apps 2026 (deep dive)
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
              <li>
                <a
                  href="https://github.com/gammaraj/foci"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </section>

          <div className="mt-12 flex flex-col sm:flex-row gap-3">
            <Link
              href="/app"
              className="btn-primary px-6 py-3 text-sm"
            >
              Try Foci — free
            </Link>
            <Link
              href="/login"
              className="btn-chip px-6 py-3 text-sm"
            >
              Create free account
            </Link>
          </div>
        </article>

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
          <Link href="/install" className="hover:text-blue-600 dark:hover:text-blue-400">
            Install
          </Link>
          {" · "}
          <Link href="/privacy" className="hover:text-blue-600 dark:hover:text-blue-400">
            Privacy
          </Link>
          {" · "}
          <Link href="/contact" className="hover:text-blue-600 dark:hover:text-blue-400">
            Contact
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
