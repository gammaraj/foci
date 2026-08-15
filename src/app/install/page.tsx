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
    <ol className="mt-5 space-y-4">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-3.5">
          <span
            className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center justify-center"
            aria-hidden
          >
            {i + 1}
          </span>
          <div className="min-w-0 pt-0.5">
            <p className="font-semibold text-slate-900 dark:text-white">{step.title}</p>
            <p className="mt-1 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              {step.body}
            </p>
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

      <main className="flex-1 app-container py-10 sm:py-14">
        <article className="max-w-5xl mx-auto">
          {/* Hero: copy + actions | desktop QR rail */}
          <div className="lg:grid lg:grid-cols-[minmax(0,1.35fr)_minmax(16rem,0.85fr)] lg:gap-12 lg:items-start">
            <div id="open">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-3">
                Install
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                Add Foci to your Home Screen
              </h1>
              <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
                Install Foci like an app. After that, one tap from your home screen — full screen,
                faster open, and offline tasks when you need them.
              </p>
              <InstallPageActions showQr />
            </div>

            <aside className="hidden lg:block mt-2">
              <div className="rounded-2xl border border-slate-200/80 dark:border-[#243350] bg-white/50 dark:bg-[#0f1b33]/60 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-3">
                  On a computer
                </p>
                <div className="flex flex-col items-start gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/install-app-qr.png"
                    alt="QR code linking to usefoci.com/app"
                    width={148}
                    height={148}
                    className="w-36 h-36 rounded-lg bg-white p-2"
                  />
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Scan with your phone, open in{" "}
                    <strong className="font-semibold text-slate-800 dark:text-slate-200">
                      Safari
                    </strong>{" "}
                    (iPhone) or{" "}
                    <strong className="font-semibold text-slate-800 dark:text-slate-200">
                      Chrome
                    </strong>{" "}
                    (Android), then follow the steps.
                  </p>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100 break-all">
                    usefoci.com/app
                  </p>
                </div>
              </div>
            </aside>
          </div>

          {/* Platform steps side-by-side on desktop */}
          <div className="mt-12 lg:mt-16 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
            <section id="iphone" className="scroll-mt-24 lg:pr-6 lg:border-r lg:border-slate-200 dark:lg:border-[#243350]">
              <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
                iPhone (Safari)
              </h2>
              <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                Three taps, once. Open{" "}
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
                        Tap Share
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
                    body: <>Done — open Foci from the new home-screen icon after that.</>,
                  },
                ]}
              />
            </section>

            <section id="android" className="scroll-mt-24">
              <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
                Android (Chrome)
              </h2>
              <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                Often one tap. If you see{" "}
                <strong className="font-semibold text-slate-800 dark:text-slate-200">Install</strong>
                , use it. Otherwise:
              </p>
              <StepList
                steps={[
                  {
                    title: "Open the menu",
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
          </div>

          <section className="mt-12 lg:mt-16 max-w-3xl space-y-3 text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">After install</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Open from the home-screen icon (not a browser tab) for the full-screen app.</li>
              <li>
                Optional free account syncs across devices; guest mode keeps data on that phone.
              </li>
            </ul>
          </section>

          <div className="mt-10 flex flex-wrap gap-3">
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
