/** High-traffic slugs from Search Console — featured on homepage & blog index. */
export const FEATURED_POST_SLUGS = [
  "flowtime-technique-guide",
  "pomodoro-vs-flowtime-vs-52-17",
  "best-free-pomodoro-apps-2026",
  "best-focus-apps-for-students-2026",
  "best-music-for-studying-and-focus",
  "52-17-rule-guide",
] as const;

/** GSC SERP overrides — shorter titles/descriptions for CTR without changing on-page H1. */
export const BLOG_POST_META_OVERRIDES: Record<
  string,
  { title?: string; description?: string }
> = {
  "best-free-pomodoro-apps-2026": {
    title: "Best Free Pomodoro Apps 2026 — Ranked (No Signup)",
    description:
      "7 free Pomodoro apps tested for ads, tasks & sounds. Foci ranks #1 — timer + tasks + brown noise, no account. Full ranking inside.",
  },
  "best-focus-apps-for-students-2026": {
    title: "Best Focus Apps for Students 2026 (Free Ranked)",
    description:
      "Free focus apps for students ranked — timer, tasks, brown noise, ADHD-friendly. Foci #1 for study sessions in one browser tab.",
  },
  "how-to-focus-while-working-from-home": {
    title: "How to Focus Working From Home (2026 System)",
    description:
      "WFH focus system: Pomodoro/52/17 blocks, ambient sound, one task list, and communication windows — free timer stack inside.",
  },
  "white-noise-vs-brown-noise-for-focus": {
    title: "White Noise vs Brown Noise for Focus (2026)",
    description:
      "White vs brown noise for studying — which masks distraction better, ADHD tips, and free offline generators in Foci.",
  },
  "foci-vs-focusatwill": {
    title: "Foci vs Focus@Will (2026): Free App or $10/mo Music?",
    description:
      "Foci vs Focus@Will — free Pomodoro, tasks, and lo-fi vs a $9.99/month music subscription. Feature table and who should pay.",
  },
  "foci-vs-todoist": {
    title: "Foci vs Todoist (2026): Free Focus Timer + Tasks?",
    description:
      "Foci vs Todoist — Pomodoro timer and task tracking in one free app vs a premium task manager. When to use each (or both).",
  },
  "foci-vs-forest-app": {
    title: "Foci vs Forest App (2026): Free Alternative That Does More",
    description:
      "Foci vs Forest — free timer, tasks, and ambient sounds vs paid gamified trees. Feature and pricing comparison for real work sessions.",
  },
  "best-music-for-studying-and-focus": {
    title: "What Music Helps You Focus? Best Study Sounds (2026)",
    description:
      "What type of music helps you focus? Brown noise, lo-fi, rain & classical ranked for studying — free built-in sounds in Foci.",
  },
  "52-17-rule-guide": {
    title: "52/17 Rule Explained (2026) — Work 52, Break 17",
    description:
      "What is the 52/17 rule? DeskTime research, vs Pomodoro, and the Francesco Cirillo myth debunked. Try the 52/17 preset free in Foci.",
  },
  "pomodoro-vs-flowtime-vs-52-17": {
    title: "Flowtime vs Pomodoro vs 52/17 — Which Should You Use?",
    description:
      "Flowtime technique vs Pomodoro vs 52/17 compared. Clear verdict for studying, coding & deep work — plus a free timer for all three.",
  },
  "flowtime-technique-guide": {
    title: "What Is the Flowtime Technique? Complete Guide (2026)",
    description:
      "What is Flowtime (flowmodoro)? How it works, break ratios, vs Pomodoro, and when to use it — start free in Foci today.",
  },
  "adhd-focus-strategies": {
    title: "ADHD Focus Strategies That Actually Work (2026)",
    description:
      "ADHD focus tips: external timers, brown noise, task chunking, and streaks that work with your brain — free tools inside.",
  },
  "brown-noise-for-studying-and-focus": {
    title: "Brown Noise for Studying: Why It Works (2026)",
    description:
      "Is brown noise good for studying? Science, vs white noise, ADHD tips, and free offline brown noise in Foci.",
  },
  "forest-app-alternatives": {
    title: "5 Best Forest App Alternatives 2026 (Free & Paid)",
    description:
      "Best Forest alternatives ranked — free timer+tasks options, Flora, Tide, and when gamified trees still win.",
  },
  "how-to-stay-focused-while-studying": {
    title: "How to Stay Focused While Studying (7 Strategies)",
    description:
      "7 evidence-based study focus strategies — time blocks, distraction removal, active recall, and a free timer stack.",
  },
  "how-to-stop-procrastinating": {
    title: "How to Stop Procrastinating: Science + Fixes (2026)",
    description:
      "Why you procrastinate and what works: shrink the first step, short timers, and environment design — try free in Foci.",
  },
  "pomodoro-technique-guide": {
    title: "Pomodoro Technique Guide (2026) — 25/5 Explained",
    description:
      "What is the Pomodoro technique? How 25/5 works, when to switch to Flowtime or 52/17, and a free timer with tasks.",
  },
  "deep-work-in-the-age-of-ai": {
    title: "Deep Work in the Age of AI — Protect Focus (2026)",
    description:
      "AI makes work faster and focus harder. How to protect deep work with session structure, sound, and a calm timer.",
  },
};

/** GSC: high-impression pages — curated related links for internal PageRank. */
export const GSC_RELATED_LINKS: Record<string, readonly string[]> = {
  "pomodoro-vs-flowtime-vs-52-17": [
    "flowtime-technique-guide",
    "52-17-rule-guide",
    "best-free-pomodoro-apps-2026",
  ],
  "flowtime-technique-guide": [
    "pomodoro-vs-flowtime-vs-52-17",
    "52-17-rule-guide",
    "best-free-pomodoro-apps-2026",
  ],
  "best-free-pomodoro-apps-2026": [
    "pomodoro-vs-flowtime-vs-52-17",
    "flowtime-technique-guide",
    "foci-vs-forest-app",
  ],
  "best-music-for-studying-and-focus": [
    "brown-noise-for-studying-and-focus",
    "best-free-pomodoro-apps-2026",
    "how-to-stay-focused-while-studying",
  ],
  "52-17-rule-guide": [
    "pomodoro-vs-flowtime-vs-52-17",
    "pomodoro-technique-guide",
    "flowtime-technique-guide",
  ],
  "foci-vs-focusatwill": [
    "best-music-for-studying-and-focus",
    "brown-noise-for-studying-and-focus",
    "best-free-pomodoro-apps-2026",
  ],
  "foci-vs-todoist": [
    "migrate-from-todoist-to-foci",
    "best-free-pomodoro-apps-2026",
    "foci-vs-forest-app",
  ],
  "foci-vs-forest-app": [
    "forest-app-alternatives",
    "best-free-pomodoro-apps-2026",
    "foci-vs-todoist",
  ],
  "best-focus-apps-for-students-2026": [
    "best-free-pomodoro-apps-2026",
    "how-to-stay-focused-while-studying",
    "adhd-focus-strategies",
  ],
  "how-to-focus-while-working-from-home": [
    "deep-work-in-the-age-of-ai",
    "pomodoro-vs-flowtime-vs-52-17",
    "best-music-for-studying-and-focus",
  ],
  "white-noise-vs-brown-noise-for-focus": [
    "brown-noise-for-studying-and-focus",
    "best-music-for-studying-and-focus",
    "adhd-focus-strategies",
  ],
  "adhd-focus-strategies": [
    "brown-noise-for-studying-and-focus",
    "flowtime-technique-guide",
    "best-focus-apps-for-students-2026",
  ],
  "how-to-stay-focused-while-studying": [
    "best-focus-apps-for-students-2026",
    "best-music-for-studying-and-focus",
    "pomodoro-technique-guide",
  ],
  "forest-app-alternatives": [
    "foci-vs-forest-app",
    "best-free-pomodoro-apps-2026",
    "best-focus-apps-for-students-2026",
  ],
};

export interface GuideLink {
  slug: string;
  label: string;
  description: string;
}

/** Sitewide internal link hub — boosts rankings via contextual backlinks. */
export const GUIDE_HUB_LINKS: GuideLink[] = [
  {
    slug: "flowtime-technique-guide",
    label: "What is the Flowtime technique?",
    description: "Complete 2026 guide — how Flowtime works, break ratios, and flowmodoro.",
  },
  {
    slug: "pomodoro-vs-flowtime-vs-52-17",
    label: "Flowtime vs Pomodoro vs 52/17",
    description: "Side-by-side comparison with a clear verdict for studying, coding, and deep work.",
  },
  {
    slug: "pomodoro-technique-guide",
    label: "Pomodoro technique guide",
    description: "The classic 25/5 method — how it works and when to use it.",
  },
  {
    slug: "52-17-rule-guide",
    label: "What is the 52/17 rule?",
    description: "Work 52 minutes, break 17 — DeskTime research, not Francesco Cirillo.",
  },
  {
    slug: "best-free-pomodoro-apps-2026",
    label: "Best free Pomodoro apps 2026",
    description: "7 timers ranked — Foci #1 with no signup, tasks, and built-in sounds.",
  },
  {
    slug: "best-focus-apps-for-students-2026",
    label: "Best focus apps for students 2026",
    description: "Free student focus apps ranked — timer, tasks, brown noise, ADHD-friendly.",
  },
  {
    slug: "how-to-focus-while-working-from-home",
    label: "How to focus while working from home",
    description: "WFH focus system with timer blocks, ambient sound, and communication windows.",
  },
  {
    slug: "white-noise-vs-brown-noise-for-focus",
    label: "White noise vs brown noise",
    description: "Which focus noise is better for studying — and when to use each.",
  },
  {
    slug: "best-music-for-studying-and-focus",
    label: "What music helps you focus?",
    description: "Best study sounds ranked — brown noise, lo-fi, rain, classical, and more.",
  },
  {
    slug: "brown-noise-for-studying-and-focus",
    label: "Brown noise for studying",
    description: "Best noise for deep reading and focus — works offline in Foci.",
  },
  {
    slug: "how-to-stay-focused-while-studying",
    label: "How to stay focused while studying",
    description: "7 evidence-based strategies for longer study sessions.",
  },
  {
    slug: "plan-trip-with-wandering-hermit",
    label: "Plan a trip with Wandering Hermit + Foci",
    description: "Build your itinerary free, then run focused Pomodoro sessions on bookings and prep.",
  },
  {
    slug: "deep-work-in-the-age-of-ai",
    label: "Deep work in the age of AI",
    description: "Protect sustained focus when everything is one click away.",
  },
];

/** Slugs that should prominently link to the Flowtime guide (GSC: position ~88). */
export const FLOWTIME_INBOUND_SLUGS = new Set([
  "pomodoro-technique-guide",
  "pomodoro-vs-flowtime-vs-52-17",
  "52-17-rule-guide",
  "how-to-stop-procrastinating",
  "how-to-stay-focused-while-studying",
  "deep-work-in-the-age-of-ai",
  "adhd-focus-strategies",
  "time-blocking-method",
  "brown-noise-for-studying-and-focus",
  "best-free-pomodoro-apps-2026",
  "best-music-for-studying-and-focus",
]);

export interface BlogFaq {
  question: string;
  answer: string;
}

/** FAQ schema for posts targeting high-impression GSC queries. */
export const BLOG_POST_FAQS: Record<string, BlogFaq[]> = {
  "pomodoro-vs-flowtime-vs-52-17": [
    {
      question: "What is the Flowtime technique?",
      answer:
        "The Flowtime technique is a flexible focus method where you work until your concentration fades, then take a break proportional to how long you worked (about 5 minutes per 25 minutes). Unlike Pomodoro's fixed 25-minute blocks, Flowtime adapts to your natural rhythm.",
    },
    {
      question: "Flowtime vs Pomodoro: which is better?",
      answer:
        "Pomodoro is better for procrastination, studying, and tasks that need external structure. Flowtime is better for creative work, programming, and deep flow. The 52/17 rule suits sustained knowledge work with longer breaks.",
    },
    {
      question: "Flowtime technique vs Pomodoro: what's the difference?",
      answer:
        "Pomodoro uses fixed 25-minute work blocks and 5-minute breaks. Flowtime has no fixed end time — you stop when focus fades and scale breaks to work duration. Flowtime protects flow states; Pomodoro adds external deadlines.",
    },
    {
      question: "What is the 52/17 rule?",
      answer:
        "The 52/17 rule means working for 52 minutes followed by a 17-minute break. It comes from a 2014 DeskTime study of highly productive employees and offers longer recovery than Pomodoro's 5-minute breaks.",
    },
    {
      question: "52/17 rule vs Pomodoro: which should I use?",
      answer:
        "Use Pomodoro (25/5) for short tasks, studying, and beating procrastination. Use 52/17 for longer writing, research, or knowledge work that needs deeper immersion and longer recovery breaks.",
    },
  ],
  "flowtime-technique-guide": [
    {
      question: "What is the Flowtime technique?",
      answer:
        "The Flowtime technique lets you work on one task until focus naturally fades, then take a proportional break. Break length scales with work time — roughly 5 minutes off for every 25 minutes on.",
    },
    {
      question: "What is flowtime?",
      answer:
        "Flowtime (or flowmodoro) is a focus method without fixed timer intervals. You work until concentration fades, log the duration, then rest proportionally. It is designed for deep work where Pomodoro's 25-minute alarm would interrupt flow.",
    },
    {
      question: "Is Flowtime good?",
      answer:
        "Yes for deep creative work, programming, and writing where a 25-minute Pomodoro alarm would interrupt flow. It is less ideal when you need external structure to start or finish short tasks — use Pomodoro then.",
    },
    {
      question: "Flowtime vs Pomodoro: what's the difference?",
      answer:
        "Pomodoro uses fixed 25-minute work intervals and 5-minute breaks. Flowtime has no fixed timer — you stop when focus fades. Flowtime suits deep creative work; Pomodoro suits tasks you procrastinate on.",
    },
    {
      question: "Who invented the Flowtime technique?",
      answer:
        "Zoë Read-Bivens created the Flowtime technique in 2016 for programming and creative work where rigid Pomodoro timers interrupted natural flow states.",
    },
  ],
  "best-free-pomodoro-apps-2026": [
    {
      question: "What is the best free Pomodoro app?",
      answer:
        "Foci ranks best overall among free Pomodoro apps in 2026 — it combines a Pomodoro timer, task tracking, ambient sounds, daily goals, and streaks with no ads or paywall. Other strong options include Pomofocus and Focus To-Do.",
    },
    {
      question: "Best free Pomodoro app in 2026?",
      answer:
        "Foci is the best free Pomodoro app in 2026 for most users: timer plus tasks, brown noise, lo-fi, daily goals, and streaks in one browser tab with no signup. Pomofocus is best for timer-only minimalists.",
    },
    {
      question: "Is there a free Pomodoro app with task tracking?",
      answer:
        "Yes. Foci, Focus To-Do, and TickTick offer free Pomodoro timers with task lists. Foci adds built-in ambient sounds and works in the browser with no signup required.",
    },
    {
      question: "Do free Pomodoro apps have ads?",
      answer:
        "Many free Pomodoro apps show ads or lock features behind premium tiers. Foci and Pomofocus are fully free without ads for core timer and task features.",
    },
  ],
  "best-music-for-studying-and-focus": [
    {
      question: "What type of music helps you focus?",
      answer:
        "Instrumental, predictable, low-complexity music helps most — lo-fi beats, ambient soundscapes, classical, and brown noise. Avoid lyrics in a language you understand and songs with dynamic shifts.",
    },
    {
      question: "What is the best music for studying?",
      answer:
        "Brown noise and rain are best for deep reading and programming. Lo-fi hip-hop suits moderate-complexity work. Classical (Baroque) works for repetitive tasks. Match the sound to task complexity.",
    },
    {
      question: "What noise is best for studying?",
      answer:
        "Brown noise and steady rain are the best noises for studying when you need to read, write, or code. They mask unpredictable background sounds without the fatigue of white noise or the distraction of lyrics.",
    },
    {
      question: "Is brown noise good for studying?",
      answer:
        "Yes. Brown noise masks irregular background sounds without high-frequency fatigue. Research and user reports suggest it helps ADHD focus and long study sessions especially well.",
    },
  ],
  "foci-vs-focusatwill": [
    {
      question: "Is Focus@Will worth it?",
      answer:
        "Focus@Will costs $9.99/month for focus music channels. It suits users who only need curated audio. Foci is free and adds a Pomodoro timer, task tracking, daily goals, and built-in lo-fi and brown noise — a better value for most students and remote workers.",
    },
    {
      question: "What is a free alternative to Focus@Will?",
      answer:
        "Foci is a free Focus@Will alternative with built-in lo-fi, Indian classical, rain, café, and brown noise alongside a Pomodoro timer and task list. No subscription or signup required.",
    },
    {
      question: "Foci vs Focus@Will: which is better?",
      answer:
        "Choose Focus@Will if you only want premium curated focus music and already have a separate timer. Choose Foci for an all-in-one free focus system — timer, tasks, sounds, and streak stats in one browser tab.",
    },
  ],
  "foci-vs-todoist": [
    {
      question: "Can Todoist replace a Pomodoro timer?",
      answer:
        "Todoist is a task manager without a built-in focus timer. You capture and organize tasks in Todoist but work elsewhere. Foci combines Pomodoro timing with task tracking so you log time on what you actually complete.",
    },
    {
      question: "Foci vs Todoist: which should I use?",
      answer:
        "Use Todoist when you need advanced project hierarchy, labels, and integrations across your whole life. Use Foci when you struggle to start and need timer plus tasks in one calm window. Many people use Todoist for planning and Foci for execution.",
    },
    {
      question: "Is there a free Todoist alternative with a timer?",
      answer:
        "Foci is a free alternative that adds Pomodoro timing, ambient sounds, daily goals, and streak tracking to task management — features Todoist locks behind premium or does not offer at all.",
    },
  ],
  "foci-vs-forest-app": [
    {
      question: "Is there a free alternative to Forest app?",
      answer:
        "Foci is a free Forest alternative with a Pomodoro timer, task tracking, ambient sounds, and streak stats — without planting virtual trees or paying for Pro features.",
    },
    {
      question: "Foci vs Forest: which is better for studying?",
      answer:
        "Forest gamifies focus with virtual trees and works well for phone distraction. Foci suits longer study sessions with task time logging, brown noise, lo-fi, and a desktop-first workflow without gamification fatigue.",
    },
  ],
  "52-17-rule-guide": [
    {
      question: "What is the 52/17 rule?",
      answer:
        "The 52/17 rule is a productivity method: work for 52 minutes, then take a 17-minute break. It comes from DeskTime data showing top performers naturally work in ~52-minute bursts.",
    },
    {
      question: "52/17 vs Pomodoro: which is better?",
      answer:
        "Pomodoro (25/5) is easier to start and better for short tasks. 52/17 gives longer focus blocks and longer recovery breaks — better for sustained knowledge work and writing.",
    },
    {
      question: "Did Francesco Cirillo create the 52/17 rule?",
      answer:
        "No. Francesco Cirillo created the Pomodoro Technique (25-minute intervals). The 52/17 rule comes from a 2014 Draugiem Group / DeskTime study of employee productivity patterns.",
    },
  ],
  "adhd-focus-strategies": [
    {
      question: "What are the best ADHD focus tools?",
      answer:
        "Tools that externalize time and working memory help most: a visible timer, a short task list, and steady sensory anchors like brown noise. Foci combines these in one free browser app with daily goals for visible momentum.",
    },
    {
      question: "Does brown noise help ADHD focus?",
      answer:
        "Many people with ADHD prefer brown noise over white noise — it masks unpredictable sounds without high-frequency harshness. Foci includes offline brown noise via the Web Audio API.",
    },
    {
      question: "Is the Pomodoro technique good for ADHD?",
      answer:
        "Yes for starting tasks and short work bursts. Rigid 25-minute alarms can interrupt hyperfocus — switch to Flowtime or longer presets when you are already in flow. Foci supports Pomodoro, Flowtime, and 52/17.",
    },
  ],
  "brown-noise-for-studying-and-focus": [
    {
      question: "Is brown noise good for studying?",
      answer:
        "Yes. Brown noise masks irregular background sounds without the fatigue of white noise. It works especially well for reading, writing, coding, and long study sessions.",
    },
    {
      question: "Where can I play brown noise free?",
      answer:
        "Foci includes a free brown noise generator that works offline in the browser — no signup or YouTube tab required. Open usefoci.com/app and start the ambient panel.",
    },
    {
      question: "Brown noise vs white noise for focus?",
      answer:
        "White noise is brighter and can feel harsh over long sessions. Brown noise is deeper and warmer, so many students and ADHD users prefer it for sustained focus.",
    },
  ],
  "forest-app-alternatives": [
    {
      question: "What are the best Forest App alternatives in 2026?",
      answer:
        "Strong Forest alternatives include Foci (free timer + tasks + ambient sounds), Flora (real-tree gamification), Tide (premium soundscapes), Be Focused (native Apple timer), and Pomofocus (minimal web timer).",
    },
    {
      question: "Is there a free Forest alternative with tasks?",
      answer:
        "Foci is a free Forest alternative with Pomodoro timing, full task tracking, brown noise, streaks, and no virtual-tree paywall. Comparison: usefoci.com/blog/foci-vs-forest-app",
    },
  ],
  "migrate-from-todoist-to-foci": [
    {
      question: "Can I import Todoist tasks into Foci?",
      answer:
        "Yes. Export a Todoist CSV, then open Foci Settings → Import & Export Tasks. Foci detects the format and lets you preview before importing.",
    },
    {
      question: "Why switch from Todoist to Foci for focus sessions?",
      answer:
        "Todoist organizes work well but has no built-in focus timer or ambient sounds. Foci is built for the work session — Pomodoro timing, task logging, and sounds in one window.",
    },
  ],
  "migrate-from-notion-to-foci": [
    {
      question: "Can I import Notion tasks into Foci?",
      answer:
        "Yes. Export your Notion database as CSV, then use Settings → Import & Export Tasks in Foci. Preview the import before confirming.",
    },
    {
      question: "Is Foci a good Notion alternative for daily focus?",
      answer:
        "Notion is flexible for docs and databases. Foci is better when you need a timer, ambient focus sounds, and per-task session tracking without building a custom dashboard.",
    },
  ],
  "migrate-from-asana-to-foci": [
    {
      question: "Can I import Asana tasks into Foci?",
      answer:
        "Yes. Export Asana as CSV and import via Foci Settings → Import & Export Tasks. Foci auto-detects common Asana CSV formats.",
    },
  ],
  "migrate-from-google-tasks-to-foci": [
    {
      question: "Can I import Google Tasks into Foci?",
      answer:
        "Yes. Export Google Tasks as JSON (or use a CSV export) and import from Settings → Import & Export Tasks. Foci previews items before you confirm.",
    },
  ],
  "pomodoro-technique-guide": [
    {
      question: "What is the Pomodoro technique?",
      answer:
        "The Pomodoro technique alternates focused work intervals (typically 25 minutes) with short breaks (typically 5 minutes). After four cycles, take a longer break. It helps start hard tasks and prevent burnout.",
    },
    {
      question: "How long is a Pomodoro session?",
      answer:
        "The classic Pomodoro is 25 minutes of work and 5 minutes of break. Foci also includes Short Sprint (15/3), Deep Work (50/10), 52/17, and Ultra Focus (90/20) presets.",
    },
    {
      question: "Where can I use a free Pomodoro timer with tasks?",
      answer:
        "Foci is a free Pomodoro app with task tracking, ambient sounds, and streaks — no signup required at usefoci.com/app.",
    },
  ],
  "how-to-stop-procrastinating": [
    {
      question: "What is the best way to stop procrastinating?",
      answer:
        "Shrink the first step, set a short timer, and remove friction. A 15–25 minute Pomodoro with one clear task beats vague motivation. Foci’s Short Sprint and Classic Pomodoro presets help you start fast.",
    },
    {
      question: "Does the Pomodoro technique help with procrastination?",
      answer:
        "Yes. Fixed short intervals lower the cost of starting. Once you are in flow, switch to Flowtime or a longer preset so the alarm does not interrupt deep work.",
    },
  ],
  "how-to-focus-while-working-from-home": [
    {
      question: "How do I stay focused while working from home?",
      answer:
        "Use a fixed session method (Pomodoro, 52/17, or Flowtime), keep tasks and the timer in one window, batch Slack outside focus blocks, and use brown noise or rain to mask home distractions.",
    },
    {
      question: "What is the best focus app for remote work?",
      answer:
        "Pick a free system with timer + tasks + ambient sound so you are not Alt-Tabbing. Foci is built for that workflow in the browser with optional cloud sync.",
    },
  ],
  "best-focus-apps-for-students-2026": [
    {
      question: "What is the best free focus app for students?",
      answer:
        "Foci ranks best overall for students who want a Pomodoro timer, task list, and brown noise in one free browser tab with no mandatory signup.",
    },
    {
      question: "Do students need a paid Forest subscription?",
      answer:
        "Not if you want tasks and ambient sounds. Forest is strong for phone gamification; Foci covers timer + tasks + sounds for free. See also forest-app-alternatives.",
    },
  ],
  "white-noise-vs-brown-noise-for-focus": [
    {
      question: "Is brown noise better than white noise for studying?",
      answer:
        "For most long study and coding sessions, yes — brown noise is deeper and less fatiguing. White noise masks a wider high-frequency range but can feel harsh over hours.",
    },
    {
      question: "Should ADHD users choose white or brown noise?",
      answer:
        "Many ADHD users prefer brown noise as a sensory anchor. Test both for 5–10 minutes on a real task and keep the one that reduces distraction without ear fatigue.",
    },
  ],
};
