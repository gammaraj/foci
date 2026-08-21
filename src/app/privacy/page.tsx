import type { Metadata } from "next";
import Link from "next/link";
import AppNavbar from "@/components/AppNavbar";
import { absolutePageTitle } from "@/lib/site-metadata";
import { CONTACT_EMAIL, SITE_URL } from "@/lib/product-facts";

const siteUrl = SITE_URL;
const title = "Privacy Policy — Foci";
const description =
  "How Foci handles your data: local-first by default, optional cloud sync, analytics, and Google advertising cookies on marketing pages. Updated August 2026.";
const lastUpdated = "August 21, 2026";

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
            You can use Foci without an account (data stays in your browser). When you create a free
            account, this policy explains what data we store, how cloud sync works, cookies,
            analytics, and advertising on public marketing pages.
          </p>

          <section className="mt-10 space-y-4 text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Your account &amp; sync</h2>
            <p>
              Guest use stores tasks and settings locally on your device. When you create a free
              account, Foci uses Supabase for authentication and cloud sync of tasks, settings, and
              streak/session data so you can use Foci across devices. Email (or other auth provider
              details you choose) is used to sign you in and protect your account. The app may also
              keep a local cache on your device for offline use.
            </p>
          </section>

          <section className="mt-10 space-y-4 text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Cookies &amp; similar technologies</h2>
            <p>
              We use cookies and similar technologies for essential site functions (for example
              keeping you signed in), analytics, and — on some public pages — advertising. You can
              control cookies through your browser settings; disabling some cookies may affect sign-in
              or other features.
            </p>
          </section>

          <section className="mt-10 space-y-4 text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Analytics</h2>
            <p>
              We may use Google Analytics 4 (when configured) to understand aggregate product usage —
              for example page views and feature events. Analytics help us improve Foci. We do not
              sell personal focus or task data.
            </p>
          </section>

          <section className="mt-10 space-y-4 text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Advertising</h2>
            <p>
              Third-party vendors, including Google, use cookies to serve ads based on a user&apos;s
              prior visits to your website or other websites. Google&apos;s use of advertising cookies
              enables it and its partners to serve ads to your users based on their visit to your
              sites and/or other sites on the Internet.
            </p>
            <p>
              Users may opt out of personalized advertising by visiting{" "}
              <a
                href="https://www.google.com/settings/ads"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Google Ads Settings
              </a>
              . You can also learn how Google uses data when you use our partners&apos; sites or apps
              at{" "}
              <a
                href="https://policies.google.com/technologies/partner-sites"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                policies.google.com/technologies/partner-sites
              </a>
              .
            </p>
            <p>
              We intend to show Google ads primarily on public marketing and content pages (for
              example the homepage, blog, and compare pages). The signed-in focus workspace (
              <Link href="/app" className="text-blue-600 dark:text-blue-400 hover:underline">
                /app
              </Link>
              ) is kept free of display ads so deep-work sessions stay distraction-free.
            </p>
          </section>

          <section className="mt-10 space-y-4 text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">What we do not do</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>No selling of personal focus or task content</li>
              <li>No paid plan required for core timer and task features</li>
              <li>No display ads inside the focus workspace (/app)</li>
            </ul>
          </section>

          <section className="mt-10 space-y-4 text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Third-party services</h2>
            <p>
              Optional features may load content from third parties you choose (for example YouTube
              embeds for live lo-fi, SoundCloud, or Spotify playlist links). Those services have
              their own privacy policies. Cloud sync and auth, when enabled, use Supabase. Advertising
              and analytics may use Google services as described above.
            </p>
          </section>

          <section className="mt-10 space-y-4 text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Contact</h2>
            <p>
              Privacy questions:{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                {CONTACT_EMAIL}
              </a>{" "}
              or visit our{" "}
              <Link href="/contact" className="text-blue-600 dark:text-blue-400 hover:underline">
                Contact
              </Link>{" "}
              page.
            </p>
          </section>
        </article>
      </main>

      <footer className="py-8 px-4 text-center border-t border-slate-200 dark:border-slate-800">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400">
            Home
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
