import type { Metadata } from "next";
import Link from "next/link";
import { FOCI_RING } from "@/lib/logo-brand";

export const metadata: Metadata = {
  title: "Theme lab",
  robots: { index: false, follow: false },
};

type ThemePalette = {
  id: string;
  name: string;
  pitch: string;
  chrome: string;
  pageLight: string;
  pageDark: string;
  surfaceLight: string;
  surfaceDark: string;
  borderLight: string;
  borderDark: string;
  logoBg: string;
  dim: string;
  mid: string;
  bright: string;
  glow: string;
  wordmarkDark: string;
  wordmarkLight: string;
  taglineDark: string;
  taglineLight: string;
  btn: string;
  btnHover: string;
  accentSoft: string;
  accentText: string;
};

const THEMES: ThemePalette[] = [
  {
    id: "current",
    name: "Current cyan",
    pitch: "What you ship today — calm SaaS teal.",
    chrome: "#0b1121",
    pageLight: "#d8e0ea",
    pageDark: "#0a0f1a",
    surfaceLight: "#ffffff",
    surfaceDark: "#111827",
    borderLight: "#c8d3e0",
    borderDark: "#243350",
    logoBg: "#0b1121",
    dim: "#0e7490",
    mid: "#0891b2",
    bright: "#06b6d4",
    glow: "#a5f3fc",
    wordmarkDark: "#22d3ee",
    wordmarkLight: "#0e7490",
    taglineDark: "#67e8f9",
    taglineLight: "#0e7490",
    btn: "#0891b2",
    btnHover: "#0e7490",
    accentSoft: "rgba(8,145,178,0.12)",
    accentText: "#0e7490",
  },
  {
    id: "teal-emerald",
    name: "1 · Deep teal → emerald",
    pitch: "Closest evolution — greener deep-work calm.",
    chrome: "#0b1121",
    pageLight: "#d5e4df",
    pageDark: "#071512",
    surfaceLight: "#ffffff",
    surfaceDark: "#0f1f1b",
    borderLight: "#b9d0c7",
    borderDark: "#1e3a32",
    logoBg: "#071512",
    dim: "#0f766e",
    mid: "#0d9488",
    bright: "#14b8a6",
    glow: "#99f6e4",
    wordmarkDark: "#2dd4bf",
    wordmarkLight: "#0f766e",
    taglineDark: "#5eead4",
    taglineLight: "#0f766e",
    btn: "#0d9488",
    btnHover: "#0f766e",
    accentSoft: "rgba(13,148,136,0.14)",
    accentText: "#0f766e",
  },
  {
    id: "warm-amber",
    name: "2 · Warm amber focus",
    pitch: "Highest contrast — timer energy, start-now glow.",
    chrome: "#0b1121",
    pageLight: "#e8e0d4",
    pageDark: "#120e0a",
    surfaceLight: "#fffbf5",
    surfaceDark: "#1a1410",
    borderLight: "#d6c7b0",
    borderDark: "#3a2e22",
    logoBg: "#120e0a",
    dim: "#b45309",
    mid: "#d97706",
    bright: "#f59e0b",
    glow: "#fde68a",
    wordmarkDark: "#fbbf24",
    wordmarkLight: "#b45309",
    taglineDark: "#fcd34d",
    taglineLight: "#b45309",
    btn: "#d97706",
    btnHover: "#b45309",
    accentSoft: "rgba(217,119,6,0.14)",
    accentText: "#b45309",
  },
  {
    id: "electric-blue",
    name: "3 · Ink + electric blue",
    pitch: "Serious tools feel — sharper, more Linear/pro.",
    chrome: "#070b16",
    pageLight: "#d7dce8",
    pageDark: "#060914",
    surfaceLight: "#ffffff",
    surfaceDark: "#0f1524",
    borderLight: "#c0c8d8",
    borderDark: "#243049",
    logoBg: "#0f172a",
    dim: "#2563eb",
    mid: "#3b82f6",
    bright: "#60a5fa",
    glow: "#dbeafe",
    wordmarkDark: "#93c5fd",
    wordmarkLight: "#1d4ed8",
    taglineDark: "#93c5fd",
    taglineLight: "#1d4ed8",
    btn: "#2563eb",
    btnHover: "#1d4ed8",
    accentSoft: "rgba(37,99,235,0.12)",
    accentText: "#1d4ed8",
  },
  {
    id: "forest-night",
    name: "4 · Forest night",
    pitch: "Moodier dark-first — mint glow on deep forest.",
    chrome: "#0a1f18",
    pageLight: "#d7e5dc",
    pageDark: "#06140f",
    surfaceLight: "#f4faf6",
    surfaceDark: "#0d1c16",
    borderLight: "#b5cebf",
    borderDark: "#1f3d30",
    logoBg: "#0a1f18",
    dim: "#047857",
    mid: "#059669",
    bright: "#34d399",
    glow: "#a7f3d0",
    wordmarkDark: "#6ee7b7",
    wordmarkLight: "#047857",
    taglineDark: "#a7f3d0",
    taglineLight: "#047857",
    btn: "#059669",
    btnHover: "#047857",
    accentSoft: "rgba(5,150,105,0.14)",
    accentText: "#047857",
  },
  {
    id: "slate-coral",
    name: "5 · Slate + coral accent",
    pitch: "Quiet UI, loud CTA — logo & buttons carry personality.",
    chrome: "#111827",
    pageLight: "#e2e5ea",
    pageDark: "#0b0f16",
    surfaceLight: "#ffffff",
    surfaceDark: "#151b26",
    borderLight: "#c9ced6",
    borderDark: "#2a3344",
    logoBg: "#111827",
    dim: "#e11d48",
    mid: "#f43f5e",
    bright: "#fb7185",
    glow: "#fecdd3",
    wordmarkDark: "#fb7185",
    wordmarkLight: "#e11d48",
    taglineDark: "#fda4af",
    taglineLight: "#be123c",
    btn: "#f43f5e",
    btnHover: "#e11d48",
    accentSoft: "rgba(244,63,94,0.12)",
    accentText: "#be123c",
  },
];

function ThemedLogoMark({
  theme,
  idPrefix,
  size = 40,
  surface = "dark",
}: {
  theme: ThemePalette;
  idPrefix: string;
  size?: number;
  surface?: "dark" | "light";
}) {
  const { r, stroke, dash, innerR, dotR, tileRx } = FOCI_RING;
  const tileFill = surface === "light" ? theme.surfaceLight : theme.logoBg;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      shapeRendering="geometricPrecision"
      className="rounded-xl shrink-0"
      style={{
        boxShadow:
          surface === "light"
            ? `0 1px 3px rgba(15,23,42,0.12), 0 0 0 1px ${theme.mid}33`
            : `0 2px 10px rgba(0,0,0,0.35), 0 0 18px ${theme.bright}55`,
      }}
      aria-hidden
    >
      <defs>
        <linearGradient id={`${idPrefix}-ring`} x1="9" y1="25" x2="25" y2="9" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={theme.dim} />
          <stop offset="50%" stopColor={theme.mid} />
          <stop offset="100%" stopColor={theme.bright} />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx={tileRx} fill={tileFill} />
      <circle cx="16" cy="16" r={r} stroke={theme.mid} strokeOpacity={0.14} strokeWidth={stroke} fill="none" />
      <circle
        cx="16"
        cy="16"
        r={r}
        stroke={`url(#${idPrefix}-ring)`}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={dash}
        transform="rotate(-90 16 16)"
      />
      <circle cx="16" cy="16" r={innerR} stroke={theme.mid} strokeOpacity={0.2} strokeWidth={1} fill="none" />
      <circle cx="16" cy="16" r={dotR} fill={theme.bright} />
    </svg>
  );
}

function ThemedWordmark({ theme, onDark }: { theme: ThemePalette; onDark: boolean }) {
  const color = onDark ? theme.wordmarkDark : theme.wordmarkLight;
  const dot = theme.bright;
  return (
    <span className="font-semibold tracking-tight lowercase inline-flex items-baseline text-[1.35rem] leading-none" aria-hidden>
      <span style={{ color }}>foc</span>
      <span className="relative inline-block">
        <span
          className="pointer-events-none absolute left-1/2 z-[1] -translate-x-1/2 rounded-full"
          style={{ width: "0.26em", height: "0.26em", top: "0.04em", backgroundColor: dot }}
        />
        <span style={{ color }}>i</span>
      </span>
    </span>
  );
}

function NavBar({
  theme,
  mode,
  idPrefix,
}: {
  theme: ThemePalette;
  mode: "light" | "dark";
  idPrefix: string;
}) {
  const light = mode === "light";
  return (
    <div
      className="px-4 py-3 border-b"
      style={{
        backgroundColor: light ? theme.surfaceLight : theme.chrome,
        borderColor: light ? theme.borderLight : "rgba(255,255,255,0.08)",
      }}
    >
      <div className="flex items-center gap-3">
        <ThemedLogoMark theme={theme} idPrefix={idPrefix} size={36} surface={light ? "light" : "dark"} />
        <div className="flex flex-col gap-1 min-w-0">
          <ThemedWordmark theme={theme} onDark={!light} />
          <span
            className="text-[8px] font-semibold tracking-[0.13em] uppercase leading-none"
            style={{ color: light ? theme.taglineLight : theme.taglineDark }}
          >
            FOCUS · FLOW · FINISH
          </span>
        </div>
        <div
          className="ml-auto flex items-center gap-3 text-xs"
          style={{ color: light ? "#64748b" : theme.wordmarkDark }}
        >
          <span className={light ? "font-medium text-slate-700" : "opacity-80"}>My Tasks</span>
          <span className={light ? "text-slate-400" : "opacity-55"}>Stats</span>
          <span
            className="px-2.5 py-1 rounded-md font-semibold text-white"
            style={{ backgroundColor: theme.btn }}
          >
            Start
          </span>
        </div>
      </div>
    </div>
  );
}

function ThemeCard({ theme }: { theme: ThemePalette }) {
  return (
    <article className="rounded-2xl overflow-hidden border border-slate-300 shadow-lg bg-white flex flex-col min-w-0">
      <header className="px-4 pt-4 pb-3 border-b border-slate-200 bg-white">
        <h2 className="text-base font-bold text-slate-900">{theme.name}</h2>
        <p className="mt-1 text-sm text-slate-500 leading-snug">{theme.pitch}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {[theme.dim, theme.mid, theme.bright, theme.btn].map((hex) => (
            <span
              key={hex}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2 py-0.5 text-[10px] tabular-nums text-slate-600"
            >
              <span className="w-2.5 h-2.5 rounded-full ring-1 ring-black/10" style={{ backgroundColor: hex }} />
              {hex}
            </span>
          ))}
        </div>
      </header>

      {/* —— Light mode (primary) —— */}
      <div className="border-b border-slate-200">
        <div className="px-3 pt-2.5 pb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Light mode</span>
        </div>
        <NavBar theme={theme} mode="light" idPrefix={`${theme.id}-nav-light`} />

        <div
          className="px-4 py-2 flex items-center justify-between text-xs border-b"
          style={{
            background: `linear-gradient(180deg, ${theme.accentSoft}, ${theme.pageLight})`,
            borderColor: theme.borderLight,
            color: theme.accentText,
          }}
        >
          <span className="font-medium">25:00 focus</span>
          <span className="opacity-70">brown noise</span>
        </div>

        <div className="p-4" style={{ backgroundColor: theme.pageLight }}>
          <div
            className="rounded-xl border p-3 shadow-sm"
            style={{ backgroundColor: theme.surfaceLight, borderColor: theme.borderLight }}
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-sm font-bold text-slate-900">Tasks</span>
              <div className="flex gap-1">
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-semibold text-white"
                  style={{ backgroundColor: theme.btn }}
                >
                  Today
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium text-slate-500 bg-slate-100">
                  Week
                </span>
              </div>
            </div>
            <div className="space-y-1.5 mb-3">
              <div
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm border-l-[3px]"
                style={{ borderLeftColor: theme.mid, backgroundColor: theme.accentSoft }}
              >
                <span className="w-3.5 h-3.5 rounded border-2 border-slate-300 shrink-0" />
                <span className="font-medium text-slate-800 truncate">Ship theme mock page</span>
                <span
                  className="ml-auto text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border shrink-0"
                  style={{ color: theme.accentText, borderColor: theme.mid, backgroundColor: theme.surfaceLight }}
                >
                  High
                </span>
              </div>
              <div
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-600 border-l-[3px]"
                style={{ borderLeftColor: theme.borderLight, backgroundColor: theme.surfaceLight }}
              >
                <span className="w-3.5 h-3.5 rounded border-2 border-slate-300 shrink-0" />
                <span className="truncate">Review overdue styling</span>
              </div>
            </div>
            <button
              type="button"
              className="w-full py-2 rounded-lg text-sm font-semibold text-white"
              style={{ backgroundColor: theme.btn }}
            >
              Start focus session
            </button>
          </div>
        </div>
      </div>

      {/* —— Dark mode peek —— */}
      <div>
        <div className="px-3 pt-2.5 pb-1 bg-slate-50 border-b border-slate-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Dark mode</span>
        </div>
        <NavBar theme={theme} mode="dark" idPrefix={`${theme.id}-nav-dark`} />
        <div className="p-4" style={{ backgroundColor: theme.pageDark }}>
          <div
            className="rounded-xl border p-3"
            style={{ backgroundColor: theme.surfaceDark, borderColor: theme.borderDark }}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-sm font-semibold text-white/90">Tasks</span>
              <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: theme.wordmarkDark }}>
                Active
              </span>
            </div>
            <div className="flex gap-2 mb-2">
              <span
                className="flex-1 text-center text-xs font-semibold py-1.5 rounded-md text-white"
                style={{ backgroundColor: theme.btn }}
              >
                Today
              </span>
              <span className="flex-1 text-center text-xs font-medium py-1.5 rounded-md text-slate-400 bg-white/5">
                Week
              </span>
              <span className="flex-1 text-center text-xs font-medium py-1.5 rounded-md text-slate-400 bg-white/5">
                Cards
              </span>
            </div>
            <div
              className="rounded-md px-2 py-1.5 text-sm border-l-[3px] text-slate-200"
              style={{ borderLeftColor: theme.bright, backgroundColor: `${theme.mid}22` }}
            >
              Deep work block
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function ThemeLabPage() {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Internal preview</p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Theme lab</h1>
            <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl">
              Each card leads with a <strong>light navbar + light app</strong>, then a dark-mode peek underneath. Pick a direction and we can wire it into the real brand tokens.
            </p>
          </div>
          <Link
            href="/app"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 underline underline-offset-2"
          >
            ← Back to app
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
          {THEMES.map((theme) => (
            <ThemeCard key={theme.id} theme={theme} />
          ))}
        </div>
      </div>
    </main>
  );
}
