"use client";

import React from "react";

/** Theme-aware landing preview aligned with /app layout (tasks left, timer right). */
export default function HomeAppMockup() {
  return (
    <div className="relative w-full max-w-4xl mx-auto">
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

      <div className="bg-[#e8edf2] dark:bg-[#0b1121] rounded-b-2xl p-3 sm:p-5 border border-slate-200 dark:border-[#1e3355] border-t-0 overflow-hidden shadow-2xl shadow-slate-900/10 dark:shadow-black/40">
        {/* Top stats bar */}
        <div className="mb-3 rounded-xl bg-white dark:bg-[#111827]/90 border border-slate-200 dark:border-[#243350] px-3 py-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
          <span className="font-semibold text-slate-800 dark:text-slate-100">Today </span>
          <span className="text-blue-600 dark:text-blue-400 font-semibold">2/3</span> sessions
          <span className="text-slate-300 dark:text-slate-600 mx-2">·</span>
          <span>3-day streak</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
          {/* Tasks column */}
          <div className="lg:flex-1 min-w-0 flex flex-col gap-2 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#1e3050] overflow-hidden">
            <div className="px-3 sm:px-4 py-3 border-b border-slate-200 dark:border-[#243350] bg-gradient-to-br from-slate-100 to-slate-50 dark:from-[#0f1b33] dark:to-[#1a2d4a]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm sm:text-base font-semibold text-slate-800 dark:text-white">Tasks</span>
                <div className="flex gap-1">
                  <span className="text-xs font-medium px-2 py-1 rounded-md bg-white text-slate-800 ring-1 ring-slate-300 shadow-sm">Today</span>
                  <span className="text-xs font-medium px-2 py-1 rounded-md text-slate-500">Week</span>
                </div>
              </div>
            </div>

            <div className="px-3 py-2 flex gap-1.5 overflow-hidden">
              <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-white text-slate-800 ring-1 ring-blue-400/50 shadow-sm shrink-0">All projects</span>
              <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#131d30] text-slate-600 dark:text-slate-300 shrink-0">General 3</span>
              <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#131d30] text-slate-600 dark:text-slate-300 shrink-0">Work 2</span>
            </div>

            <div className="px-3 flex gap-1.5">
              <div className="flex-1 px-2.5 py-2 text-xs text-slate-400 bg-slate-50 dark:bg-[#131d30] border border-slate-200 dark:border-[#243350] rounded-lg">
                Add a task to General…
              </div>
              <div className="px-3 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg">Add</div>
            </div>

            <div className="px-3 pb-3 space-y-1.5">
              {[
                { title: "Research API integration", active: true },
                { title: "Draft design mockups", active: false },
                { title: "Review pull requests", done: true },
              ].map((task) => (
                <div
                  key={task.title}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm ${
                    task.active
                      ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-600 ring-1 ring-blue-400/20"
                      : task.done
                        ? "opacity-60"
                        : "bg-slate-50 dark:bg-[#131d30]/80 border border-slate-100 dark:border-[#243350]"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-md border-2 flex-shrink-0 ${
                      task.done ? "border-green-500 bg-green-500" : task.active ? "border-blue-500" : "border-slate-300 dark:border-slate-600"
                    }`}
                  />
                  <span className={`flex-1 truncate ${task.done ? "line-through text-slate-400" : "text-slate-800 dark:text-slate-100 font-medium"}`}>
                    {task.title}
                  </span>
                  {task.active && (
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400 hidden sm:inline">→ Timer</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Timer column */}
          <div className="lg:w-[42%] shrink-0 flex flex-col gap-2 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#1e3050] overflow-hidden">
            <div className="px-3 py-3 border-b border-slate-200 dark:border-[#243350] bg-gradient-to-br from-slate-100 to-slate-50 dark:from-[#0f1b33] dark:to-[#1a2d4a]">
              <span className="text-sm font-semibold text-slate-800 dark:text-white">Focus Timer</span>
            </div>

            <div className="px-3 py-1">
              <div className="rounded-lg border border-blue-200 dark:border-blue-700 bg-blue-50/80 dark:bg-blue-900/20 px-2.5 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-500 dark:text-blue-400">Linked from tasks</p>
                <p className="text-xs font-semibold text-blue-800 dark:text-blue-100 truncate">Research API integration</p>
              </div>
            </div>

            <div className="flex flex-col items-center py-2 px-3">
              <div className="relative w-28 h-28 sm:w-32 sm:h-32">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="45" fill="none" className="stroke-slate-200 dark:stroke-slate-600" strokeWidth="3" />
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#3b82f6" strokeWidth="3.5" strokeDasharray="283" strokeDashoffset="70" strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center px-2">
                  <span className="text-[10px] sm:text-xs font-medium text-slate-600 dark:text-slate-300">Focus Time</span>
                  <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tabular-nums">22:30</span>
                  <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 text-center leading-tight">In progress</span>
                </div>
              </div>
              <div className="flex gap-1 mt-2 w-full max-w-[200px]">
                {["15m", "25m", "30m", "45m"].map((p, i) => (
                  <span
                    key={p}
                    className={`flex-1 text-center text-[10px] sm:text-xs py-1 rounded-md font-semibold ${
                      i === 2 ? "bg-white dark:bg-[#1a2d4a] text-blue-700 dark:text-blue-300 shadow-sm" : "text-slate-500"
                    }`}
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>

            <div className="mx-3 mb-3 rounded-lg border border-slate-200 dark:border-[#243350] bg-slate-50 dark:bg-[#131d30] px-2.5 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Now playing</p>
              <p className="text-xs font-medium text-slate-800 dark:text-slate-100 truncate">Peaceful Meditation</p>
              <div className="flex gap-1 mt-1.5">
                {["Rain", "Café", "Brown"].map((label, i) => (
                  <span
                    key={label}
                    className={`text-[10px] px-2 py-1 rounded-md font-medium ${i === 0 ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" : "bg-white dark:bg-[#1a2d4a] text-slate-500"}`}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -inset-6 bg-gradient-to-b from-blue-500/[0.06] via-transparent to-indigo-500/[0.04] rounded-3xl -z-10 blur-2xl pointer-events-none" />
    </div>
  );
}
