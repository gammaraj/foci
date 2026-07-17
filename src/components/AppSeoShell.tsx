/** Crawlable product copy for /app — visible to crawlers via noscript; JSON-LD always present. */
const siteUrl = "https://usefoci.com";

function safeJsonLd(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}

const appJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Foci Focus Timer",
  url: `${siteUrl}/app`,
  applicationCategory: "ProductivityApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires a modern web browser with JavaScript enabled",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD", availability: "https://schema.org/OnlineOnly" },
  description:
    "Free Pomodoro timer app with tasks, Smart Plan, brown noise, lo-fi, daily goals, and streaks. No signup required. Available worldwide at usefoci.com/app.",
  featureList: [
    "Pomodoro, Flowtime, and 52/17 timer presets",
    "Task tracking with per-task time logging",
    "Smart Plan day-by-day scheduling",
    "Offline ambient sounds including brown noise",
    "Daily goals and streak tracking",
    "Import from Todoist, Notion, Asana, Google Tasks",
    "Installable PWA with offline support",
  ],
  inLanguage: "en-US",
  areaServed: { "@type": "Place", name: "Worldwide" },
  isAccessibleForFree: true,
};

export default function AppSeoShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(appJsonLd) }}
      />
      <noscript>
        <div style={{ maxWidth: 640, margin: "2rem auto", padding: "0 1rem", fontFamily: "system-ui, sans-serif" }}>
          <h1>Foci — Free Pomodoro Timer App</h1>
          <p>
            Foci is a free focus system: Pomodoro timer, tasks, Smart Plan, brown noise, lo-fi,
            daily goals, and streaks in one browser tab. No signup required. Available worldwide
            in English at {siteUrl}/app.
          </p>
          <ul>
            <li>Timer presets: Pomodoro (25/5), Deep Work (50/10), 52/17, Ultra Focus (90/20)</li>
            <li>Task tracking with automatic per-task session logging</li>
            <li>Offline ambient sounds: rain, café, white noise, brown noise</li>
            <li>Import tasks from Todoist, Notion, Asana, or Google Tasks</li>
            <li>Optional free account to sync streaks across devices</li>
          </ul>
          <p>
            <a href={siteUrl}>Home</a>
            {" · "}
            <a href={`${siteUrl}/about`}>About Foci</a>
            {" · "}
            <a href={`${siteUrl}/blog`}>Focus guides</a>
            {" · "}
            <a href={`${siteUrl}/login`}>Create free account</a>
          </p>
        </div>
      </noscript>
      {children}
    </>
  );
}
