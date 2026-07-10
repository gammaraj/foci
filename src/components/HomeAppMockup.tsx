"use client";

import React from "react";
import { FociLogoMark, FociWordmark } from "@/components/FociLogoMark";
import { FOCI_TAGLINE_FOCUS, FOCI_TAGLINE_MOCKUP, FOCI_TAGLINE_ON_DARK, FOCI_WORDMARK_MOCKUP } from "@/lib/logo-brand";

type MockDueVariant = "today" | "overdue" | "future";

function MockDueBadge({ label, variant }: { label: string; variant: MockDueVariant }) {
  const tone =
    variant === "today"
      ? "text-amber-200 bg-amber-950/45 border-amber-700/45"
      : variant === "overdue"
        ? "text-red-300 bg-red-950/50 border-red-800/50"
        : "text-slate-200 bg-white/8 border-[#2a3f5f]/80";

  return (
    <span className={`text-[11px] px-1.5 py-0.5 rounded-md font-semibold shrink-0 leading-none border ${tone}`}>
      {label}
    </span>
  );
}

function MockBucketTask({
  title,
  active = false,
  dueLabel,
  dueVariant,
}: {
  title: string;
  active?: boolean;
  dueLabel?: string;
  dueVariant?: MockDueVariant;
}) {
  return (
    <div
      className={`rounded-lg border px-2 py-1.5 ${
        active
          ? "border-cyan-500/40 bg-cyan-950/30"
          : "border-[#2a3f5f]/90 bg-white/[0.03] hover:bg-white/[0.05]"
      }`}
    >
      <div className="flex items-start gap-2 min-h-[1.5rem]">
        <div
          className={`mt-[3px] w-4 h-4 rounded-full border-[1.5px] flex-shrink-0 ${
            active ? "border-cyan-500" : "border-slate-600"
          }`}
        />
        <span className={`flex-1 min-w-0 text-xs leading-snug truncate ${active ? "text-slate-100 font-medium" : "text-slate-300"}`}>
          {title}
        </span>
        {dueLabel && dueVariant ? <MockDueBadge label={dueLabel} variant={dueVariant} /> : null}
      </div>
    </div>
  );
}

function MockBucketColumn({
  name,
  color,
  personal = false,
  open,
  completed,
  lanes,
  className = "",
}: {
  name: string;
  color?: string;
  personal?: boolean;
  open: number;
  completed: number;
  lanes: {
    label: string;
    labelClass?: string;
    tasks: { title: string; active?: boolean; dueLabel?: string; dueVariant?: MockDueVariant }[];
  }[];
  className?: string;
}) {
  return (
    <div
      className={`flex-[0_0_calc(100%-1.5rem)] sm:flex-[0_0_calc((100%-1.5rem)/2.15)] min-w-0 flex flex-col rounded-2xl min-h-[9rem] max-h-[14rem] bg-[#131d30]/90 border border-[#243350]/70 ${className}`}
    >
      <div
        className={`flex items-center gap-2 px-3 py-2.5 shrink-0 rounded-t-2xl border-b border-[#243350]/60 ${
          personal ? "bg-gradient-to-br from-slate-800/55 to-[#151c2c]/40" : ""
        }`}
        style={
          !personal && color
            ? { background: `linear-gradient(135deg, color-mix(in srgb, ${color} 12%, transparent), transparent 72%)` }
            : undefined
        }
      >
        {color && (
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-1 ring-white/10" style={{ backgroundColor: color }} aria-hidden />
        )}
        <span className="text-sm font-semibold text-slate-100 truncate">{name}</span>
        {personal && (
          <span className="text-[10px] font-medium text-slate-200 bg-[#1e3050]/90 border border-[#3a5070]/70 rounded-full px-2 py-0.5 shrink-0">
            Personal
          </span>
        )}
        <span className="ml-auto text-[10px] tabular-nums rounded-full px-2 py-0.5 shrink-0 bg-[#1e3050]/90 border border-[#3a5070]/70 text-slate-200">
          <span className="font-semibold text-slate-50">{open}</span> open ·{" "}
          <span className="font-medium text-emerald-300">{completed} done</span>
        </span>
      </div>

      <div className="px-3 pt-2 pb-1 shrink-0 border-b border-[#243350]/50">
        <div className="px-2 py-1.5 text-[11px] text-slate-500 bg-[#0d1526] border border-[#243350] rounded-lg">
          Add a task…
        </div>
      </div>

      <div className="flex-1 overflow-hidden px-2 py-2 space-y-3 min-h-0">
        {lanes.map((lane) => (
          <div key={lane.label}>
            <p className={`bucket-lane-label px-1 mb-1.5 text-[11px] ${lane.labelClass ?? ""}`}>{lane.label}</p>
            <div className="space-y-1.5">
              {lane.tasks.map((task) => (
                <MockBucketTask
                  key={task.title}
                  title={task.title}
                  active={task.active}
                  dueLabel={task.dueLabel}
                  dueVariant={task.dueVariant}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Theme-aware landing preview aligned with /app layout (nav, status strip, bucket view). */
export default function HomeAppMockup() {
  return (
    <div className="relative w-full max-w-5xl mx-auto">
      <div className="rounded-t-2xl bg-slate-200/90 dark:bg-[#1a1a2e] px-4 py-3 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
          <div className="w-3 h-3 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="bg-white dark:bg-[#0d1117] rounded-md px-4 py-1 text-xs text-slate-500 dark:text-slate-400 font-mono border border-slate-200 dark:border-transparent">
            usefoci.com/app
          </div>
        </div>
      </div>

      <div className="dark bg-[#0b1121] rounded-b-2xl border border-[#1e3355] border-t-0 overflow-hidden shadow-2xl shadow-black/40">
        {/* Nav chrome */}
        <div className="px-3 sm:px-4 pt-2.5 pb-2 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <FociLogoMark
              size={32}
              idPrefix="mockup-nav"
              surface="dark"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex-shrink-0"
            />
            <div className="flex flex-col items-start gap-0.5 min-w-0">
              <FociWordmark className={FOCI_WORDMARK_MOCKUP} tone="dark" />
              <p className={`${FOCI_TAGLINE_MOCKUP} ${FOCI_TAGLINE_ON_DARK} whitespace-nowrap`}>
                {FOCI_TAGLINE_FOCUS}
              </p>
            </div>
          </div>
        </div>

        <div className="p-2.5 sm:p-3 space-y-2.5">
          {/* Status strip — weather · timer · music */}
          <div className="grid min-w-0 grid-cols-1 sm:grid-cols-[2.2fr_3fr_3.2fr] sm:items-stretch rounded-xl border border-[#243350] bg-[#131d30]/90 overflow-hidden divide-y sm:divide-y-0 sm:divide-x divide-[#243350]/80">
            <div className="min-w-0 px-3 py-2.5 flex items-center">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-100 tabular-nums leading-none">2:57 PM</p>
                <p className="mt-1 text-[11px] text-slate-400 truncate">
                  <span aria-hidden>☀️</span> 72° · Partly cloudy
                </p>
              </div>
            </div>

            <div className="min-w-0 px-3 py-2 flex items-center gap-2 border-cyan-600/30 bg-cyan-900/15">
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="flex items-center gap-[3px]" aria-hidden>
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span className="w-2 h-2 rounded-full bg-slate-600" />
                </span>
                <span className="text-xs text-orange-400" aria-hidden>🔥</span>
              </div>
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <span className="text-base font-mono font-semibold tabular-nums text-cyan-400 leading-none">22:30</span>
                <span className="hidden sm:inline text-[11px] text-slate-400 truncate">Research API integration</span>
              </div>
              <span className="shrink-0 px-2.5 py-1 rounded-lg bg-cyan-600 text-white text-[11px] font-semibold">
                Start
              </span>
            </div>

            <div className="min-w-0 px-3 py-2 bg-white/[0.018]">
              <div className="grid grid-cols-4 gap-1 mb-1.5">
                {[
                  { label: "Rain", active: true },
                  { label: "Café", active: false },
                  { label: "White", active: false },
                  { label: "Brown", active: false },
                ].map((sound) => (
                  <span
                    key={sound.label}
                    className={`text-center py-1 px-0.5 rounded-md text-[10px] font-medium ${
                      sound.active
                        ? "bg-cyan-900/40 text-cyan-300 ring-1 ring-cyan-600/40"
                        : "bg-[#1a2d4a] text-slate-400"
                    }`}
                  >
                    {sound.label}
                  </span>
                ))}
              </div>
              <p className="text-[10px] font-semibold text-slate-300 truncate">Peaceful Meditation</p>
            </div>
          </div>

          {/* Tasks panel — bucket view */}
          <div className="rounded-2xl bg-[#111827] border border-[#1e3050] overflow-hidden">
            <div className="panel-header-calm px-3 sm:px-4 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-slate-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span className="text-sm font-semibold text-white">Tasks</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 pl-6 hidden sm:block">All projects side by side</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="hidden sm:flex items-center gap-1 rounded-lg bg-black/20 p-0.5">
                    {["All", "Today", "Week"].map((tab, i) => (
                      <span
                        key={tab}
                        className={`px-2 py-1 rounded-md text-[11px] font-medium ${
                          i === 0 ? "bg-white/15 text-white" : "text-slate-400"
                        }`}
                      >
                        {tab}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-0.5 rounded-lg bg-black/20 p-0.5">
                    <span className="p-1.5 rounded-md bg-white/20 text-white" title="Bucket view" aria-hidden>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 0v10" />
                      </svg>
                    </span>
                    <span className="p-1.5 rounded-md text-slate-500" title="List view" aria-hidden>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-3 py-2 flex items-center gap-2 border-b border-[#243350]/80 bg-[#0d1526]/50">
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m0 4v2m0-2a2 2 0 100 4m0-4a2 2 0 110 4m0 4v2m0-2a2 2 0 100 4m0-4a2 2 0 110 4" />
                </svg>
                Manage projects
              </span>
            </div>

            <div className="px-1 sm:px-2 pb-3 pt-2">
              <div className="flex gap-3 overflow-hidden">
                <MockBucketColumn
                  name="General"
                  personal
                  open={2}
                  completed={1}
                  lanes={[
                    {
                      label: "Due today",
                      labelClass: "text-amber-400",
                      tasks: [
                        {
                          title: "Research API integration",
                          active: true,
                          dueLabel: "Today",
                          dueVariant: "today",
                        },
                      ],
                    },
                    {
                      label: "No date",
                      tasks: [{ title: "Draft design mockups" }],
                    },
                  ]}
                />
                <MockBucketColumn
                  name="Work"
                  color="#6366f1"
                  open={1}
                  completed={1}
                  lanes={[
                    {
                      label: "Overdue",
                      labelClass: "text-red-400",
                      tasks: [
                        {
                          title: "Review pull requests",
                          dueLabel: "Jun 18 2d",
                          dueVariant: "overdue",
                        },
                      ],
                    },
                  ]}
                />
                <MockBucketColumn
                  name="Learning"
                  color="#10b981"
                  open={2}
                  completed={0}
                  className="opacity-40"
                  lanes={[
                    {
                      label: "Scheduled",
                      tasks: [
                        {
                          title: "Read focus research",
                          dueLabel: "Jun 28",
                          dueVariant: "future",
                        },
                      ],
                    },
                  ]}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -inset-6 bg-gradient-to-b from-cyan-500/[0.06] via-transparent to-indigo-500/[0.04] rounded-3xl -z-10 blur-2xl pointer-events-none" />
    </div>
  );
}
