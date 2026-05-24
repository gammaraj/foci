/** High-traffic slugs from Search Console — featured on homepage & blog index. */
export const FEATURED_POST_SLUGS = [
  "pomodoro-vs-flowtime-vs-52-17",
  "best-free-pomodoro-apps-2026",
  "best-music-for-studying-and-focus",
  "52-17-rule-guide",
  "flowtime-technique-guide",
] as const;

export interface GuideLink {
  slug: string;
  label: string;
  description: string;
}

/** Sitewide internal link hub — boosts rankings via contextual backlinks. */
export const GUIDE_HUB_LINKS: GuideLink[] = [
  {
    slug: "flowtime-technique-guide",
    label: "Flowtime technique guide",
    description: "Work with your natural focus rhythm — no rigid 25-minute blocks.",
  },
  {
    slug: "pomodoro-vs-flowtime-vs-52-17",
    label: "Flowtime vs Pomodoro vs 52/17",
    description: "Side-by-side comparison with a clear verdict for your work style.",
  },
  {
    slug: "pomodoro-technique-guide",
    label: "Pomodoro technique guide",
    description: "The classic 25/5 method — how it works and when to use it.",
  },
  {
    slug: "52-17-rule-guide",
    label: "52/17 rule guide",
    description: "Work 52 minutes, break 17 — the DeskTime research explained.",
  },
  {
    slug: "best-free-pomodoro-apps-2026",
    label: "Best free Pomodoro apps",
    description: "7 timers tested and ranked — tasks, sounds, and no paywalls.",
  },
  {
    slug: "best-music-for-studying-and-focus",
    label: "Best music for studying",
    description: "What type of music helps you focus — lo-fi, brown noise, classical.",
  },
  {
    slug: "how-to-stay-focused-while-studying",
    label: "How to stay focused while studying",
    description: "7 evidence-based strategies for longer study sessions.",
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
      question: "What is the 52/17 rule?",
      answer:
        "The 52/17 rule means working for 52 minutes followed by a 17-minute break. It comes from a 2014 DeskTime study of highly productive employees and offers longer recovery than Pomodoro's 5-minute breaks.",
    },
  ],
  "flowtime-technique-guide": [
    {
      question: "What is the Flowtime technique?",
      answer:
        "The Flowtime technique lets you work on one task until focus naturally fades, then take a proportional break. Break length scales with work time — roughly 5 minutes off for every 25 minutes on.",
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
      question: "Is brown noise good for studying?",
      answer:
        "Yes. Brown noise masks irregular background sounds without high-frequency fatigue. Research and user reports suggest it helps ADHD focus and long study sessions especially well.",
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
};
