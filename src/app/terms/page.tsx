import type { Metadata } from "next";
import Link from "next/link";
import AppNavbar from "@/components/AppNavbar";
import { absolutePageTitle } from "@/lib/site-metadata";

const siteUrl = "https://usefoci.com";
const title = "Terms of Use — Foci";
const description =
  "Terms of use for Foci at usefoci.com: free focus app provided as-is, acceptable use, optional accounts, and limitations of liability. Updated July 2026.";
const lastUpdated = "July 27, 2026";

export const metadata: Metadata = {
  title: absolutePageTitle(title),
  description,
  alternates: { canonical: "/terms" },
  openGraph: {
    title,
    description,
    url: `${siteUrl}/terms`,
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

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0a0f1a]">
      <AppNavbar />

      <main className="flex-1 app-container py-12 sm:py-16">
        <article className="max-w-2xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-3">
            Legal
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
            Terms of Use
          </h1>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Last updated: {lastUpdated}
          </p>
          <p className="mt-5 text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            By using Foci at{" "}
            <a href={siteUrl} className="text-blue-600 dark:text-blue-400 hover:underline">
              usefoci.com
            </a>
            , you agree to these terms. If you do not agree, please do not use the service.
          </p>

          <section className="mt-10 space-y-4 text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">The service</h2>
            <p>
              Foci is a free focus productivity web app (tasks, Smart Plan, ambient sounds, optional
              timer, and related features). A free account is required to use the product and sync
              across devices.
            </p>
          </section>

          <section className="mt-10 space-y-4 text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Acceptable use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Abuse, disrupt, or attempt unauthorized access to the service or other users&apos; data</li>
              <li>Use Foci to violate applicable law</li>
              <li>Reverse engineer or scrape the service in a way that harms availability or security</li>
            </ul>
          </section>

          <section className="mt-10 space-y-4 text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Your content</h2>
            <p>
              You retain ownership of tasks and other content you enter. Account data is stored so
              you can use Foci across devices. You are responsible for backing up important data
              (export is available in the app).
            </p>
          </section>

          <section className="mt-10 space-y-4 text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Disclaimer</h2>
            <p>
              Foci is provided &quot;as is&quot; without warranties of any kind, express or implied.
              We do not guarantee uninterrupted availability, fitness for a particular purpose, or
              that the service will meet all of your productivity needs.
            </p>
          </section>

          <section className="mt-10 space-y-4 text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Limitation of liability</h2>
            <p>
              To the fullest extent permitted by law, Foci and its operators are not liable for
              indirect, incidental, special, consequential, or punitive damages, or any loss of
              data, profits, or productivity arising from your use of the service.
            </p>
          </section>

          <section className="mt-10 space-y-4 text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Changes</h2>
            <p>
              We may update these terms from time to time. Continued use of Foci after changes
              means you accept the updated terms. The &quot;Last updated&quot; date at the top
              reflects the latest revision.
            </p>
          </section>

          <section className="mt-10 space-y-4 text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Privacy</h2>
            <p>
              See our{" "}
              <Link href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">
                Privacy Policy
              </Link>{" "}
              for how data is handled.
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
          <Link href="/privacy" className="hover:text-blue-600 dark:hover:text-blue-400">
            Privacy
          </Link>
          {" · "}
          Built for focus.
        </p>
      </footer>
    </div>
  );
}
