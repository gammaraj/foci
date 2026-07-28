import type { Metadata } from "next";
import Link from "next/link";
import AppNavbar from "@/components/AppNavbar";
import { absolutePageTitle } from "@/lib/site-metadata";

const siteUrl = "https://usefoci.com";
const title = "Privacy Policy — Foci";
const description =
  "How Foci handles your data: local-first by default, optional cloud sync via Supabase, no ads, and no selling of personal focus data. Updated July 2026.";
const lastUpdated = "July 27, 2026";

export const metadata: Metadata = {
  title: absolutePageTitle(title),
  description,
  alternates: { canonical: "/privacy" },
  openGraph: {
    title,
    description,
    url: `${siteUrl}/privacy`,
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

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0a0f1a]">
      <AppNavbar />

      <main className="flex-1 app-container py-12 sm:py-16">
        <article className="max-w-2xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-3">
            Legal
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Last updated: {lastUpdated}
          </p>
          <p className="mt-5 text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            Foci is local-first. You can use the app without an account. This policy explains what
            data stays on your device, what optional cloud sync stores, and what we do not do.
          </p>

          <section className="mt-10 space-y-4 text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Guest mode (no account)</h2>
            <p>
              Without signing in, tasks, settings, session history, and preferences are stored in
              your browser (local storage / IndexedDB as applicable). That data stays on your
              device unless you export it or clear your browser storage.
            </p>
          </section>

          <section className="mt-10 space-y-4 text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Optional accounts &amp; sync</h2>
            <p>
              If you create a free account, Foci uses Supabase for authentication and optional cloud
              sync of tasks, settings, and streak/session data so you can use Foci across devices.
              Email (or other auth provider details you choose) is used to sign you in and protect
              your account.
            </p>
          </section>

          <section className="mt-10 space-y-4 text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Analytics</h2>
            <p>
              We may use privacy-respecting analytics (such as Google Analytics 4 when configured)
              to understand aggregate product usage — for example page views and feature events.
              Analytics are not used to sell personal focus data or show ads in Foci.
            </p>
          </section>

          <section className="mt-10 space-y-4 text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">What we do not do</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>No ads in the Foci product UI</li>
              <li>No selling of personal focus or task data</li>
              <li>No requirement to create an account to use core features</li>
            </ul>
          </section>

          <section className="mt-10 space-y-4 text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Third-party services</h2>
            <p>
              Optional features may load content from third parties you choose (for example YouTube
              embeds for live lo-fi, SoundCloud, or Spotify playlist links). Those services have
              their own privacy policies. Cloud sync and auth, when enabled, use Supabase.
            </p>
          </section>

          <section className="mt-10 space-y-4 text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Contact</h2>
            <p>
              Questions about privacy: visit{" "}
              <Link href="/about" className="text-blue-600 dark:text-blue-400 hover:underline">
                About Foci
              </Link>{" "}
              or reach out via{" "}
              <a
                href="https://twitter.com/usefoci"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                @usefoci
              </a>
              .
            </p>
          </section>
        </article>
      </main>

      <footer className="py-8 px-4 text-center border-t border-slate-200 dark:border-slate-800">
        <p className="text-sm text-slate-400 dark:text-slate-600">
          <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400">
            Home
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
