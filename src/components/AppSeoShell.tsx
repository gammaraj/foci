/** Crawlable product copy for /app — visible to crawlers via noscript; JSON-LD always present. */
import {
  SITE_URL,
  FOCI_ONE_LINER,
  FOCI_APP_DESCRIPTION,
  FOCI_ACCOUNT_POLICY_SHORT,
  PRODUCT_DATE_MODIFIED,
} from "@/lib/product-facts";

function safeJsonLd(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}

const appJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Foci",
  url: `${SITE_URL}/app`,
  applicationCategory: "ProductivityApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires a modern web browser with JavaScript enabled",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD", availability: "https://schema.org/OnlineOnly" },
  description: FOCI_APP_DESCRIPTION,
  dateModified: PRODUCT_DATE_MODIFIED,
  featureList: [
    "Task tracking with projects, subtasks, and per-task time logging",
    "Smart Plan day-by-day scheduling with One Thing and Focus actions",
    "Shareable layout URLs: /app/cards, /app/buckets, /app/list, /app/calendar, /app/plan",
    "Today's One Thing daily priority",
    "Done tally for today, this week, and this month",
    "Pomodoro, Flowtime, and 52/17 timer presets",
    "Offline ambient sounds including brown noise, rain, and café",
    "Live lo-fi streams and curated Spotify playlists",
    "Daily goals and streak tracking",
    "Card, list, bucket (kanban), calendar, and Smart Plan views",
    "Import from Todoist, Notion, Asana, Google Tasks",
    "Installable PWA with offline support",
    "Optional free account for cross-device sync",
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
          <h1>Foci — Free Task Manager &amp; Focus App</h1>
          <p>{FOCI_ONE_LINER}</p>
          <p>{FOCI_ACCOUNT_POLICY_SHORT}</p>
          <h2>How to use Foci</h2>
          <ol>
            <li>Open {SITE_URL}/app (no signup required to start).</li>
            <li>Add tasks and organize them into projects — or start from a project template.</li>
            <li>
              Open Smart Plan at {SITE_URL}/app/plan to schedule the week, set Today&apos;s One Thing, and start Focus.
            </li>
            <li>Optionally start a focus session (Pomodoro 25/5, Deep Work 50/10, or 52/17).</li>
            <li>Turn on brown noise, rain, café, or lo-fi while you work.</li>
            <li>Hit your daily goal and build a streak. Create a free account only if you want sync.</li>
          </ol>
          <h2>Task layouts</h2>
          <ul>
            <li>
              <a href={`${SITE_URL}/app/cards`}>Cards</a> — default project cards
            </li>
            <li>
              <a href={`${SITE_URL}/app/buckets`}>Buckets</a> — kanban columns
            </li>
            <li>
              <a href={`${SITE_URL}/app/list`}>List</a> — grind through open work
            </li>
            <li>
              <a href={`${SITE_URL}/app/calendar`}>Calendar</a> — due dates
            </li>
            <li>
              <a href={`${SITE_URL}/app/plan`}>Smart Plan</a> — capacity schedule + One Thing
            </li>
          </ul>
          <h2>Features</h2>
          <ul>
            <li>Timer presets: Pomodoro (25/5), Deep Work (50/10), 52/17, Ultra Focus (90/20)</li>
            <li>Task tracking with automatic per-task session logging</li>
            <li>Smart Plan algorithmic day-by-day scheduling with Focus / One Thing actions</li>
            <li>Done tally: completions today, this week, and this month</li>
            <li>Offline ambient sounds: rain, café, white noise, brown noise</li>
            <li>Card, list, bucket (kanban), calendar, and Smart Plan views</li>
            <li>Import tasks from Todoist, Notion, Asana, or Google Tasks</li>
            <li>Optional free account to sync streaks across devices</li>
          </ul>
          <h2>FAQ</h2>
          <p>
            <strong>Do I need an account?</strong> No — you can use the app without signing in.
            A free account is optional for cloud sync.
          </p>
          <p>
            <strong>Is Foci free?</strong> Yes. No credit card. No premium paywall for core focus features.
          </p>
          <p>
            <strong>Where is Foci available?</strong> Worldwide in English at {SITE_URL}/app.
          </p>
          <p>
            <a href={SITE_URL}>Home</a>
            {" · "}
            <a href={`${SITE_URL}/about`}>About Foci</a>
            {" · "}
            <a href={`${SITE_URL}/install`}>Add to Home Screen</a>
            {" · "}
            <a href={`${SITE_URL}/vs/forest`}>Foci vs Forest</a>
            {" · "}
            <a href={`${SITE_URL}/alternatives/pomodoro-apps`}>Best free Pomodoro apps</a>
            {" · "}
            <a href={`${SITE_URL}/blog`}>Focus guides</a>
            {" · "}
            <a href={`${SITE_URL}/feed.xml`}>RSS</a>
            {" · "}
            <a href={`${SITE_URL}/login`}>Create free account</a>
          </p>
        </div>
      </noscript>
      {children}
    </>
  );
}
