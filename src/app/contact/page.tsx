import type { Metadata } from "next";
import Link from "next/link";
import AppNavbar from "@/components/AppNavbar";
import { absolutePageTitle } from "@/lib/site-metadata";
import { CONTACT_EMAIL, SITE_URL, FOCI_SAME_AS } from "@/lib/product-facts";

const title = "Contact Foci";
const description =
  "Contact the Foci team at usefoci.com — privacy questions, product feedback, and partnership inquiries.";

export const metadata: Metadata = {
  title: absolutePageTitle(title),
  description,
  alternates: { canonical: "/contact" },
  openGraph: {
    title,
    description,
    url: `${SITE_URL}/contact`,
    type: "website",
    siteName: "Foci",
    images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: "Foci" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [`${SITE_URL}/twitter-image`],
  },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0a0f1a]">
      <AppNavbar />

      <main className="flex-1 app-container py-12 sm:py-16">
        <article className="max-w-2xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-3">
            Contact
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
            Get in touch
          </h1>
          <p className="mt-5 text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            Questions about Foci, privacy, or partnerships — we read every message. For fastest
            replies, email us directly.
          </p>

          <section className="mt-10 space-y-4 text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Email</h2>
            <p>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                {CONTACT_EMAIL}
              </a>
            </p>
            <p className="text-sm">
              Privacy requests, account help, and product feedback are welcome. We typically reply
              within a few business days.
            </p>
          </section>

          <section className="mt-10 space-y-4 text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Social</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <a
                  href={FOCI_SAME_AS[0]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  @usefoci on X / Twitter
                </a>
              </li>
              <li>
                <a
                  href={FOCI_SAME_AS[2]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  GitHub — gammaraj/foci
                </a>
              </li>
            </ul>
          </section>

          <section className="mt-10 space-y-4 text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Policies</h2>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Terms of Use
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-blue-600 dark:text-blue-400 hover:underline">
                  About Foci
                </Link>
              </li>
            </ul>
          </section>
        </article>
      </main>

      <footer className="py-8 px-4 text-center border-t border-slate-200 dark:border-slate-800">
        <p className="text-sm text-slate-500 dark:text-slate-400">
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
