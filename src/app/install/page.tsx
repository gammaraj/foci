import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import AppNavbar from "@/components/AppNavbar";
import GuideLinkHub from "@/components/GuideLinkHub";
import InstallPageActions from "@/components/InstallPageActions";
import { absolutePageTitle } from "@/lib/site-metadata";
import { SITE_URL, PRODUCT_DATE_MODIFIED } from "@/lib/product-facts";
import { FOCI_APP_INSTALL_URL } from "@/lib/pwa-install";

const siteUrl = SITE_URL;
const path = "/install";
const title = "Add Foci to Home Screen — iPhone & Android";
const description =
  "Install Foci as an app on your phone. Android often gets one-tap Install; iPhone uses Safari Share → Add to Home Screen (Apple does not allow a one-tap web install).";

export const metadata: Metadata = {
  title: absolutePageTitle(title),
  description,
  alternates: { canonical: path },
  openGraph: {
    title,
    description,
    url: `${siteUrl}${path}`,
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

const howToJsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "Add Foci to your phone Home Screen",
  description,
  dateModified: PRODUCT_DATE_MODIFIED,
  totalTime: "PT2M",
  supply: [],
  tool: [
    { "@type": "HowToTool", name: "Safari (iPhone)" },
    { "@type": "HowToTool", name: "Chrome (Android)" },
  ],
  step: [
    {
      "@type": "HowToStep",
      name: "Open Foci on your phone",
      text: `Open ${FOCI_APP_INSTALL_URL} in Safari on iPhone or Chrome on Android.`,
      url: `${siteUrl}${path}#open`,
    },
    {
      "@type": "HowToStep",
      name: "iPhone — Add to Home Screen",
      text: "In Safari, tap Share, then Add to Home Screen, then Add.",
      url: `${siteUrl}${path}#iphone`,
    },
    {
      "@type": "HowToStep",
      name: "Android — Install or Add to Home screen",
      text: "In Chrome, tap Install when available, or use the menu → Install app / Add to Home screen.",
      url: `${siteUrl}${path}#android`,
    },
  ],
};

function StepList({
  steps,
}: {
  steps: { title: ReactNode; body: ReactNode }[];
}) {
  return (
    <ol className="mt-6 space-y-5">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-4">
          <span
            className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-sm font-bold flex items-center justify-center"
            aria-hidden
          >
            {i + 1}
          </span>
          <div className="min-w-0 pt-0.5">
            <p className="font-semibold text-slate-900 dark:text-white">{step.title}</p>
            <p className="mt-1 text-slate-600 dark:text-slate-400 leading-relaxed">{step.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function InstallPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--page-bg)] dark:bg-[#070b16]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(howToJsonLd) }}
      />
      <AppNavbar />

      <main className="flex-1 app-container py-12 sm:py-16">
        <article className="max-w-2xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-3">
            Install
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
            Add Foci to your Home Screen
          </h1>
          <p className="mt-5 text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
            Install Foci like an app. After that, one tap from your home screen — full screen, faster
            open, and offline tasks when you need them.
          </p>

          <div id="open">
            <InstallPageActions />
          </div>

          <section
            id="easier"
            className="mt-14 scroll-mt-24 space-y-4 text-base text-slate-600 dark:text-slate-400 leading-relaxed"
          >
            <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
              Why so many steps on iPhone?
            </h2>
            <p>
              Apple does not let websites show a one-tap{" "}
              <strong className="font-semibold text-slate-800 dark:text-slate-200">Install</strong>{" "}
              button (Android Chrome does). On iPhone, every site — including Foci — must go through
              Safari’s Share menu. There is no official shortcut around that.
            </p>
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              Easier options that do help:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="font-semibold text-slate-800 dark:text-slate-200">
                  Android / Chrome:
                </strong>{" "}
                use the one-tap{" "}
                <strong className="font-semibold text-slate-800 dark:text-slate-200">Install</strong>{" "}
                button above when it appears, or the in-app prompt after a focus session.
              </li>
              <li>
                <strong className="font-semibold text-slate-800 dark:text-slate-200">
                  Already on a computer:
                </strong>{" "}
                scan the QR (or text yourself{" "}
                <a
                  href={FOCI_APP_INSTALL_URL}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  usefoci.com/app
                </a>
                ), open it in Safari on the phone, then do the three taps once.
              </li>
              <li>
                <strong className="font-semibold text-slate-800 dark:text-slate-200">
                  Stuck in Chrome / Instagram / Gmail on iPhone:
                </strong>{" "}
                those browsers can’t install a real home-screen app. Tap Share →{" "}
                <strong className="font-semibold text-slate-800 dark:text-slate-200">
                  Open in Safari
                </strong>
                , then follow the iPhone steps.
              </li>
              <li>
                <strong className="font-semibold text-slate-800 dark:text-slate-200">
                  Lighter option:
                </strong>{" "}
                Safari Share →{" "}
                <strong className="font-semibold text-slate-800 dark:text-slate-200">
                  Add Bookmark
                </strong>{" "}
                is fewer taps, but it stays inside Safari (no full-screen app icon). Home Screen is
                better if you use Foci daily.
              </li>
            </ul>
          </section>

          <section id="iphone" className="mt-14 scroll-mt-24">
            <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
              iPhone (Safari) — three taps, once
            </h2>
            <p className="mt-2 text-slate-600 dark:text-slate-400 leading-relaxed">
              Open{" "}
              <a
                href={FOCI_APP_INSTALL_URL}
                className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                usefoci.com/app
              </a>{" "}
              in Safari, then:
            </p>
            <StepList
              steps={[
                {
                  title: "Tap Share",
                  body: (
                    <>
                      Tap the{" "}
                      <strong className="font-semibold text-slate-800 dark:text-slate-200">
                        Share
                      </strong>{" "}
                      button
                      <span
                        className="inline-flex align-middle mx-1 text-blue-600 dark:text-blue-400"
                        aria-hidden
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 3l4 4h-3v8h-2V7H8l4-4zm-7 14h14v2H5v-2z" />
                        </svg>
                      </span>
                      at the bottom of Safari (top on iPad).
                    </>
                  ),
                },
                {
                  title: "Add to Home Screen",
                  body: (
                    <>
                      Scroll and tap{" "}
                      <strong className="font-semibold text-slate-800 dark:text-slate-200">
                        Add to Home Screen
                      </strong>
                      .
                    </>
                  ),
                },
                {
                  title: "Tap Add",
                  body: (
                    <>
                      Tap{" "}
                      <strong className="font-semibold text-slate-800 dark:text-slate-200">
                        Add
                      </strong>
                      . Done — open Foci from the new icon after that.
                    </>
                  ),
                },
              ]}
            />
          </section>

          <section id="android" className="mt-14 scroll-mt-24">
            <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
              Android (Chrome) — often one tap
            </h2>
            <p className="mt-2 text-slate-600 dark:text-slate-400 leading-relaxed">
              If Chrome shows{" "}
              <strong className="font-semibold text-slate-800 dark:text-slate-200">Install</strong>{" "}
              (button above, banner, or in-app prompt), use that. Otherwise:
            </p>
            <StepList
              steps={[
                {
                  title: "Open the browser menu",
                  body: (
                    <>
                      Tap{" "}
                      <strong className="font-semibold text-slate-800 dark:text-slate-200">⋮</strong>{" "}
                      (top right in Chrome).
                    </>
                  ),
                },
                {
                  title: "Install or Add to Home screen",
                  body: (
                    <>
                      Choose{" "}
                      <strong className="font-semibold text-slate-800 dark:text-slate-200">
                        Install app
                      </strong>{" "}
                      or{" "}
                      <strong className="font-semibold text-slate-800 dark:text-slate-200">
                        Add to Home screen
                      </strong>
                      , then confirm.
                    </>
                  ),
                },
              ]}
            />
          </section>

          <section className="mt-14 space-y-3 text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">After install</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Open Foci from the home-screen icon (not a browser tab) for the full-screen app.</li>
              <li>
                Optional free account syncs tasks across devices; guest mode keeps data on that phone.
              </li>
            </ul>
          </section>

          <div className="mt-12 flex flex-wrap gap-3">
            <Link
              href="/app"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Open Foci
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg border border-slate-300 dark:border-[#243350] text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-[#111827] transition-colors"
            >
              About Foci
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
          <Link href="/about" className="hover:text-blue-600 dark:hover:text-blue-400">
            About
          </Link>
          {" · "}
          <Link href="/privacy" className="hover:text-blue-600 dark:hover:text-blue-400">
            Privacy
          </Link>
          {" · "}
          <Link href="/terms" className="hover:text-blue-600 dark:hover:text-blue-400">
            Terms
          </Link>
        </p>
      </footer>
    </div>
  );
}
