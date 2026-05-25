"use client";

import React from "react";

/** Theme-aware landing page app preview (light + dark). */
export default function HomeAppMockup() {
  return (
    <div className="relative w-full max-w-4xl mx-auto">
      <div className="rounded-t-2xl bg-slate-200 dark:bg-[#1a1a2e] px-4 py-3 flex items-center gap-2">
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

      <div className="bg-white dark:bg-[#0a1628] rounded-b-2xl p-4 sm:p-6 border border-slate-200 dark:border-[#1e3355] border-t-0 overflow-hidden shadow-xl dark:shadow-none">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
          <div className="sm:w-[38%] flex flex-col gap-3">
            <div className="flex items-center justify-between rounded-xl px-3 py-2 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-[#0f1b33] dark:to-[#1a2d4a]">
              <span className="text-sm font-semibold text-slate-800 dark:text-white tracking-wide">Focus Timer</span>
              <div className="flex items-center gap-1">
                <div className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-slate-200/80 dark:hover:bg-white/10">
                  <svg className="w-3.5 h-3.5 text-slate-500 dark:text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                </div>
                <div className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-slate-200/80 dark:hover:bg-white/10">
                  <svg className="w-3.5 h-3.5 text-slate-500 dark:text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3 py-2">
              <div className="relative w-32 h-32 sm:w-36 sm:h-36">
                <svg viewBox="0 0 120 120" className="w-full h-full">
                  <circle cx="60" cy="60" r="52" fill="none" className="stroke-slate-200 dark:stroke-[#1e3355]" strokeWidth="6" />
                  <circle cx="60" cy="60" r="52" fill="none" stroke="#3b82f6" strokeWidth="6"
                    strokeDasharray="326.7" strokeDashoffset="81.7" strokeLinecap="round"
                    transform="rotate(-90 60 60)" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Focus Time</span>
                  <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-mono">22:30</span>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5">Working...</span>
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#1e3355] flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#1e3355] flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 text-center -mt-1">Working on: Research API integration</p>

            <div className="bg-slate-50 dark:bg-[#0f1b33] rounded-xl p-3 text-center border border-slate-100 dark:border-transparent">
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Today&apos;s Sessions</div>
              <div className="flex items-center gap-2 justify-center">
                <span className="text-lg font-bold text-slate-900 dark:text-white">2</span>
                <span className="text-xs text-slate-500">/ 3 sessions</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-[#1a2744] rounded-full h-2 mt-2 overflow-hidden">
                <div className="h-full rounded-full bg-blue-500" style={{ width: "66%" }} />
              </div>
              <div className="flex items-center justify-center gap-1 mt-2">
                <span className="text-yellow-500 dark:text-yellow-400 text-xs">✨</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">3 day streak</span>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-[#0f1b33] rounded-xl p-3 border border-slate-100 dark:border-transparent">
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">🎵 Music &amp; Sounds</div>
              <div className="flex gap-1.5">
                {["Rain", "Café", "Brown"].map((s, i) => (
                  <div key={s} className={`flex-1 text-center text-[10px] py-1.5 rounded-lg border ${
                    i === 2
                      ? "border-blue-400/60 bg-blue-50 dark:border-blue-500/40 dark:bg-blue-600/10 text-blue-700 dark:text-blue-300"
                      : "border-slate-200 dark:border-[#243350] text-slate-500"
                  }`}>
                    {s}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="sm:w-[62%] flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-900 dark:text-white">Tasks</span>
              <div className="flex gap-1">
                {["Today", "Week"].map((f, i) => (
                  <span key={f} className={`text-[10px] px-2 py-1 rounded-md ${i === 0 ? "bg-blue-100 dark:bg-blue-600/20 text-blue-700 dark:text-blue-400" : "text-slate-500"}`}>{f}</span>
                ))}
              </div>
            </div>

            <button type="button" className="w-full flex items-center justify-center gap-1.5 text-[11px] text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 rounded-lg py-1.5 bg-blue-50 dark:bg-blue-600/5">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
              Recommend Execution Plan
            </button>

            <div className="flex gap-1">
              <div className="px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-600/20 text-blue-700 dark:text-blue-400 text-[11px] font-medium">All <span className="opacity-60">5</span></div>
              <div className="px-2.5 py-1 rounded-lg text-slate-500 text-[11px]">General <span className="text-slate-400 dark:text-slate-600">3</span></div>
              <div className="px-2.5 py-1 rounded-lg text-slate-500 text-[11px]">Work <span className="text-slate-400 dark:text-slate-600">2</span></div>
            </div>

            <div className="flex gap-1.5">
              <div className="flex-1 flex items-center bg-slate-50 dark:bg-[#131d30] border border-slate-200 dark:border-[#243350] rounded-lg px-2.5 py-1.5">
                <span className="text-[11px] text-slate-400 dark:text-slate-500">Add a task...</span>
              </div>
              <div className="px-2.5 py-1.5 bg-blue-600 text-white text-[11px] font-semibold rounded-lg">Add</div>
            </div>

            {[
              { title: "Research API integration", sessions: 3, time: "1h 30m", active: true },
              { title: "Draft design mockups", sessions: 1, time: "30m", active: false },
              { title: "Review pull requests", sessions: 0, time: "0m", done: true },
              { title: "Write unit tests", sessions: 2, time: "1h", active: false },
            ].map((task, i) => (
              <div key={i} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl ${
                task.active
                  ? "bg-blue-50 dark:bg-blue-600/10 border border-blue-200 dark:border-blue-500/30"
                  : "bg-slate-50 dark:bg-[#0f1b33] border border-transparent"
              }`}>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  task.done ? "border-green-500 bg-green-500" : task.active ? "border-blue-500" : "border-slate-300 dark:border-slate-600"
                }`}>
                  {task.done && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className={`text-sm flex-1 ${task.done ? "line-through text-slate-400 dark:text-slate-500" : "text-slate-800 dark:text-slate-200"}`}>
                  {task.title}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 hidden sm:inline">{task.sessions}s · {task.time}</span>
                {!task.done && !task.active && (
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">Start</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/5 via-transparent to-blue-500/5 rounded-3xl -z-10 blur-2xl" />
    </div>
  );
}
