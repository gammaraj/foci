import { DEFAULT_PROJECT_ID } from "./types";

// ====== Timer Presets ======

export interface TimerPreset {
  label: string;
  emoji: string;
  workMin: number;
  breakMin: number;
  description: string;
}

export const TIMER_PRESETS: TimerPreset[] = [
  { label: "Classic Pomodoro", emoji: "🍅", workMin: 25, breakMin: 5, description: "The original Pomodoro technique" },
  { label: "Foci Default", emoji: "⏱️", workMin: 30, breakMin: 5, description: "Balanced 30/5 default" },
  { label: "Short Sprint", emoji: "⚡", workMin: 15, breakMin: 3, description: "Quick bursts for small tasks" },
  { label: "Deep Work", emoji: "🧠", workMin: 50, breakMin: 10, description: "Extended focus sessions" },
  { label: "52/17 Rule", emoji: "📊", workMin: 52, breakMin: 17, description: "Based on productivity research" },
  { label: "Ultra Focus", emoji: "🔥", workMin: 90, breakMin: 20, description: "Maximum deep work block" },
];

// ====== Daily Goal Presets ======

export interface GoalPreset {
  label: string;
  emoji: string;
  sessions: number;
  description: string;
}

export const GOAL_PRESETS: GoalPreset[] = [
  { label: "Light", emoji: "🌱", sessions: 4, description: "~2 hours of focus" },
  { label: "Standard", emoji: "💪", sessions: 8, description: "~4 hours of focus" },
  { label: "Intense", emoji: "🔥", sessions: 12, description: "~6 hours of focus" },
];

// ====== Project Templates ======

export interface ProjectTemplate {
  label: string;
  /** Compact chip label (chips row); falls back to `label`. */
  shortLabel?: string;
  emoji: string;
  description: string;
  /** Optional grouping for pickers (e.g. Finance). */
  category?: "workflow" | "finance";
  tasks: string[];
}

/** @deprecated Use ProjectTemplate */
export type TaskTemplate = ProjectTemplate;

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    label: "Morning Routine",
    shortLabel: "Morning",
    emoji: "🌅",
    description: "Start your day right",
    category: "workflow",
    tasks: ["Plan today's priorities", "Check & respond to emails", "Identify top 3 must-do tasks"],
  },
  {
    label: "Study Session",
    shortLabel: "Study",
    emoji: "📚",
    description: "Structured learning block",
    category: "workflow",
    tasks: ["Review previous notes", "Study new material", "Practice problems / exercises", "Summarize key takeaways"],
  },
  {
    label: "Dev Sprint",
    shortLabel: "Dev Sprint",
    emoji: "💻",
    description: "Focused coding workflow",
    category: "workflow",
    tasks: ["Plan feature / review requirements", "Implement code changes", "Write tests", "Code review & cleanup"],
  },
  {
    label: "Writing Block",
    shortLabel: "Writing",
    emoji: "✍️",
    description: "Focused writing session",
    category: "workflow",
    tasks: ["Outline key points", "Write first draft", "Edit and revise", "Final review & polish"],
  },
  {
    label: "Meeting Prep",
    shortLabel: "Meeting",
    emoji: "📋",
    description: "Get ready for meetings",
    category: "workflow",
    tasks: ["Review agenda", "Prepare talking points", "Gather required documents", "Note follow-up actions"],
  },
  {
    label: "Weekly Review",
    shortLabel: "Review",
    emoji: "📊",
    description: "End-of-week reflection",
    category: "workflow",
    tasks: ["Review completed tasks", "Assess goal progress", "Identify blockers", "Plan next week's priorities"],
  },
  {
    label: "Trip Planning",
    shortLabel: "Trip",
    emoji: "✈️",
    description: "Focused travel prep — pair with Wandering Hermit itineraries",
    category: "workflow",
    tasks: [
      "Research visa and entry requirements",
      "Compare flights and travel dates",
      "Book accommodation for trip dates",
      "Set trip budget and daily spending limit",
      "Review day-by-day itinerary (focus session 1)",
      "Book trains, tours, or must-reserve restaurants",
      "Download language cheat sheet for destination",
      "Confirm travel insurance and emergency contacts",
      "Final packing list and check-in times",
    ],
  },
  {
    label: "Financial Life Plan",
    shortLabel: "Life Plan",
    emoji: "🧭",
    description: "End-to-end money system: cash flow, protection, debt, investing, and goals",
    category: "finance",
    tasks: [
      "Write money values and 1-, 5-, and 10-year goals",
      "List all income sources and take-home pay",
      "Map monthly fixed costs and must-pay bills",
      "Track variable spending for 30 days",
      "Build a zero-based or 50/30/20 monthly budget",
      "Automate paycheck splits (bills, savings, investing, spending)",
      "Set emergency fund target and open HYSA if needed",
      "List debts with balance, rate, and minimum payment",
      "Choose debt payoff method and first target",
      "Confirm health, life, disability, and property insurance coverage",
      "Max employer retirement match (401k/403b)",
      "Open or fund IRA / brokerage and set contribution rate",
      "Define target asset allocation and rebalance rule",
      "Set sinking funds (taxes, travel, car, home, gifts)",
      "Review tax withholding, credits, and estimated payments",
      "Draft or update will, beneficiaries, and key contacts",
      "Calculate current net worth baseline",
      "Schedule quarterly money review on the calendar",
    ],
  },
  {
    label: "Monthly Budget",
    shortLabel: "Budget",
    emoji: "💵",
    description: "Review income, spending, and savings",
    category: "finance",
    tasks: [
      "List income sources for the month",
      "Categorize last month's spending",
      "Set category budgets",
      "Schedule bill payments",
      "Review subscriptions to cancel or keep",
      "Set savings transfer for the month",
    ],
  },
  {
    label: "Debt Payoff",
    shortLabel: "Debt",
    emoji: "📉",
    description: "Organize and attack debt",
    category: "finance",
    tasks: [
      "List all debts with balances and rates",
      "Choose avalanche or snowball order",
      "Set this month's extra payment amount",
      "Automate minimum payments",
      "Make extra payment on priority debt",
      "Update payoff tracker",
    ],
  },
  {
    label: "Emergency Fund",
    shortLabel: "Emergency",
    emoji: "🛟",
    description: "Build a cash safety net",
    category: "finance",
    tasks: [
      "Set target (3–6 months of expenses)",
      "Open or confirm high-yield savings account",
      "Calculate monthly contribution",
      "Automate transfer on payday",
      "Review progress and adjust",
    ],
  },
  {
    label: "Investing Setup",
    shortLabel: "Investing",
    emoji: "📈",
    description: "Get accounts and contributions in order",
    category: "finance",
    tasks: [
      "Confirm retirement account eligibility (401k/IRA)",
      "Set contribution rate and auto-invest",
      "Choose or rebalance target allocation",
      "Max employer match if available",
      "Review fees and fund choices",
      "Schedule next portfolio check-in",
    ],
  },
  {
    label: "Tax Prep",
    shortLabel: "Tax Prep",
    emoji: "🧾",
    description: "Gather documents and file with less stress",
    category: "finance",
    tasks: [
      "Collect W-2s / 1099s",
      "Gather deductible expense records",
      "Download investment tax forms",
      "Confirm filing status and credits",
      "Complete draft return or send to preparer",
      "File return and store confirmation",
    ],
  },
  {
    label: "Net Worth Review",
    shortLabel: "Net Worth",
    emoji: "🧮",
    description: "Snapshot assets, liabilities, and goals",
    category: "finance",
    tasks: [
      "Update bank and investment balances",
      "Update debt balances",
      "Calculate net worth",
      "Compare to last quarter",
      "Set or adjust one money goal",
    ],
  },
];

/** Convert a project template into Task objects ready to save */
export function templateToTasks(
  template: ProjectTemplate,
  projectId: string = DEFAULT_PROJECT_ID
) {
  return template.tasks.map((title) => ({
    id: crypto.randomUUID(),
    title,
    completed: false,
    sessions: 0,
    timeSpent: 0,
    createdAt: Date.now(),
    projectId,
    subtasks: [],
  }));
}
