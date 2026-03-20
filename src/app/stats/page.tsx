"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/components/AuthProvider";
import Navbar from "@/components/Navbar";
import {
  loadStreakHistory,
  loadTasks,
  loadProjects,
  loadSettings,
} from "@/lib/storage";
import type {
  StreakHistory,
  Task,
  Project,
  Settings,
} from "@/lib/types";
import { PROJECT_COLORS } from "@/lib/types";
import { formatDateLocal } from "@/lib/dates";

// ── Helpers ──────────────────────────────────────────────

function formatMs(ms: number): string {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

const dateKey = formatDateLocal;

function getDaysArray(count: number): string[] {
  const days: string[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push(dateKey(d));
  }
  return days;
}

function dayLabel(key: string): string {
  const d = new Date(key + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

// ── Chart components ─────────────────────────────────────

function BarChart({
  data,
  labelFn,
  valueSuffix = "",
  color = "#3b82f6",
}: {
  data: { key: string; value: number }[];
  labelFn: (key: string) => string;
  valueSuffix?: string;
  color?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex items-end gap-1 sm:gap-2 h-52 w-full">
      {data.map((d) => {
        const pct = (d.value / max) * 100;
        return (
          <div key={d.key} className="group flex flex-col items-center flex-1 min-w-0 h-full justify-end">
            <span className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-300 mb-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
              {d.value > 0 ? `${d.value}${valueSuffix}` : ""}
            </span>
            <div
              className="w-full rounded-t-md transition-all duration-300 group-hover:opacity-80"
              style={{
                height: `${Math.max(pct, d.value > 0 ? 4 : 0)}%`,
                backgroundColor: color,
                minHeight: d.value > 0 ? 4 : 0,
              }}
            />
            <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1.5 truncate w-full text-center">
              {labelFn(d.key)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function HorizontalBar({
  items,
}: {
  items: { label: string; value: number; color: string }[];
}) {
  const max = Math.max(...items.map((i) => i.value), 1);
  const total = items.reduce((s, i) => s + i.value, 0);

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label}>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium text-gray-700 dark:text-gray-200 truncate mr-2">
              {item.label}
            </span>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {total > 0 ? Math.round((item.value / total) * 100) : 0}%
              </span>
              <span className="text-gray-500 dark:text-gray-400 font-medium">
                {formatMs(item.value)}
              </span>
            </div>
          </div>
          <div className="w-full bg-gray-100 dark:bg-[#1a2744] rounded-full h-2.5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(item.value / max) * 100}%`,
                backgroundColor: item.color,
                minWidth: item.value > 0 ? 8 : 0,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Heatmap ──────────────────────────────────────────────

function Heatmap({
  streakHistory,
  weeks = 16,
}: {
  streakHistory: StreakHistory;
  weeks?: number;
}) {
  const totalDays = weeks * 7;
  const today = new Date();
  const todayDay = today.getDay(); // 0 = Sun

  // Build grid: columns = weeks, rows = days of week (Mon–Sun)
  // We want the last column to end on today
  const cells: { key: string; count: number; col: number; row: number }[] = [];
  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const k = dateKey(d);
    const dayOfWeek = d.getDay(); // 0=Sun
    const row = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Mon=0..Sun=6
    const daysFromEnd = i;
    const col = weeks - 1 - Math.floor((daysFromEnd + (6 - todayDay + 1) % 7) / 7);
    cells.push({
      key: k,
      count: streakHistory.days[k]?.sessionCount ?? 0,
      col,
      row,
    });
  }

  const maxCount = Math.max(...cells.map((c) => c.count), 1);

  function getColor(count: number): string {
    if (count === 0) return "var(--heatmap-empty)";
    const intensity = count / maxCount;
    if (intensity <= 0.25) return "var(--heatmap-l1)";
    if (intensity <= 0.5) return "var(--heatmap-l2)";
    if (intensity <= 0.75) return "var(--heatmap-l3)";
    return "var(--heatmap-l4)";
  }

  const dayLabels = ["Mon", "", "Wed", "", "Fri", "", ""];

  return (
    <div className="overflow-x-auto">
      <div
        className="inline-grid gap-[3px]"
        style={{
          gridTemplateColumns: `auto repeat(${weeks}, 1fr)`,
          gridTemplateRows: `repeat(7, 1fr)`,
        }}
      >
        {/* Day labels */}
        {dayLabels.map((label, row) => (
          <div
            key={`label-${row}`}
            className="text-[10px] text-gray-400 dark:text-gray-500 pr-2 flex items-center justify-end"
            style={{ gridColumn: 1, gridRow: row + 1 }}
          >
            {label}
          </div>
        ))}
        {/* Cells */}
        {cells.map((cell) => (
          <div
            key={cell.key}
            className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[3px] transition-colors"
            style={{
              gridColumn: cell.col + 2,
              gridRow: cell.row + 1,
              backgroundColor: getColor(cell.count),
            }}
            title={`${cell.key}: ${cell.count} session${cell.count !== 1 ? "s" : ""}`}
          />
        ))}
      </div>
      <style jsx global>{`
        :root {
          --heatmap-empty: #e5e7eb;
          --heatmap-l1: #bbf7d0;
          --heatmap-l2: #4ade80;
          --heatmap-l3: #16a34a;
          --heatmap-l4: #166534;
        }
        :root.dark, .dark {
          --heatmap-empty: #1e293b;
          --heatmap-l1: #064e3b;
          --heatmap-l2: #047857;
          --heatmap-l3: #10b981;
          --heatmap-l4: #34d399;
        }
        @media (prefers-color-scheme: dark) {
          :root:not(.light) {
            --heatmap-empty: #1e293b;
            --heatmap-l1: #064e3b;
            --heatmap-l2: #047857;
            --heatmap-l3: #10b981;
            --heatmap-l4: #34d399;
          }
        }
      `}</style>
    </div>
  );
}

// ── Donut chart ──────────────────────────────────────────

function DonutChart({
  items,
}: {
  items: { label: string; value: number; color: string }[];
}) {
  const total = items.reduce((s, i) => s + i.value, 0);
  if (total === 0) return null;

  const radius = 50;
  const stroke = 14;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex items-center gap-6">
      <div className="relative flex-shrink-0">
        <svg width="140" height="140" viewBox="0 0 140 140">
          {items.map((item) => {
            const pct = item.value / total;
            const dash = pct * circumference;
            const seg = (
              <circle
                key={item.label}
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth={stroke}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
                className="transition-all duration-500"
                transform="rotate(-90 70 70)"
              />
            );
            offset += dash;
            return seg;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-gray-900 dark:text-white">{formatMs(total)}</span>
          <span className="text-[10px] text-gray-500 dark:text-gray-400">Total</span>
        </div>
      </div>
      <div className="flex flex-col gap-2 min-w-0">
        {items.slice(0, 5).map((item) => (
          <div key={item.label} className="flex items-center gap-2 min-w-0">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-xs text-gray-700 dark:text-gray-300 truncate">{item.label}</span>
          </div>
        ))}
        {items.length > 5 && (
          <span className="text-xs text-gray-400 dark:text-gray-500">+{items.length - 5} more</span>
        )}
      </div>
    </div>
  );
}

// ── Stat card ────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  trend,
  accentBg,
  accentText,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  trend?: { value: string; positive: boolean } | null;
  accentBg?: string;
  accentText?: string;
}) {
  return (
    <div className="bg-white dark:bg-[#0f1b33] rounded-2xl p-4 sm:p-5 border border-gray-200 dark:border-[#1e3355] shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${accentBg ?? "bg-blue-50 dark:bg-blue-900/30"} ${accentText ?? "text-blue-600 dark:text-blue-400"}`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            trend.positive
              ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
              : "bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400"
          }`}>
            {trend.positive ? "↑" : "↓"} {trend.value}
          </span>
        )}
      </div>
      <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}

// ── PROJECT COLORS (fallback) ────────────────────────────
const FALLBACK_COLORS = PROJECT_COLORS;

// ══════════════════════════════════════════════════════════
// PAGE
// ══════════════════════════════════════════════════════════

export default function StatsPage() {
  const { user, loading: authLoading } = useAuth();

  const [streakHistory, setStreakHistory] = useState<StreakHistory>({ days: {} });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [range, setRange] = useState<7 | 30>(7);
  const [loaded, setLoaded] = useState(false);

  // Load data
  useEffect(() => {
    if (authLoading) return;
    (async () => {
      const [sh, t, p, s] = await Promise.all([
        loadStreakHistory(),
        loadTasks(),
        loadProjects(),
        loadSettings(),
      ]);
      setStreakHistory(sh);
      setTasks(t);
      setProjects(p);
      setSettings(s);
      setLoaded(true);
    })();
  }, [authLoading, user]);

  // ── Derived data ────────────────────────────────────────

  const days = getDaysArray(range);
  const workDuration = settings?.workDuration ?? 30 * 60 * 1000;

  // Sessions per day
  const sessionsData = days.map((key) => ({
    key,
    value: streakHistory.days[key]?.sessionCount ?? 0,
  }));

  // Focus time per day (sessions × workDuration)
  const focusData = days.map((key) => ({
    key,
    value: Math.round(((streakHistory.days[key]?.sessionCount ?? 0) * workDuration) / 60_000),
  }));

  // Total stats
  const allDayKeys = Object.keys(streakHistory.days);
  const totalSessions = allDayKeys.reduce((s, k) => s + (streakHistory.days[k]?.sessionCount ?? 0), 0);
  const totalFocusMs = totalSessions * workDuration;
  const activeDays = allDayKeys.filter((k) => (streakHistory.days[k]?.sessionCount ?? 0) > 0).length;
  const avgSessionsPerDay = activeDays > 0 ? (totalSessions / activeDays).toFixed(1) : "0";

  // Current streak
  let currentStreak = 0;
  {
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const k = dateKey(d);
      if (streakHistory.days[k]?.goalMet) {
        currentStreak++;
      } else if (i > 0) {
        break;
      }
    }
  }

  // Longest streak
  let longestStreak = 0;
  {
    const sorted = allDayKeys.sort();
    let run = 0;
    for (let i = 0; i < sorted.length; i++) {
      if (!streakHistory.days[sorted[i]]?.goalMet) {
        run = 0;
        continue;
      }
      if (run > 0) {
        const prev = new Date(sorted[i - 1] + "T00:00:00");
        const curr = new Date(sorted[i] + "T00:00:00");
        const diffDays = (curr.getTime() - prev.getTime()) / 86_400_000;
        if (diffDays !== 1) {
          run = 1;
        } else {
          run++;
        }
      } else {
        run = 1;
      }
      longestStreak = Math.max(longestStreak, run);
    }
  }

  // Trend: compare current range sessions with previous range
  const trendData = useMemo(() => {
    const currentDays = getDaysArray(range);
    const prevDays: string[] = [];
    const now = new Date();
    for (let i = range * 2 - 1; i >= range; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      prevDays.push(dateKey(d));
    }
    const curr = currentDays.reduce((s, k) => s + (streakHistory.days[k]?.sessionCount ?? 0), 0);
    const prev = prevDays.reduce((s, k) => s + (streakHistory.days[k]?.sessionCount ?? 0), 0);
    if (prev === 0) return null;
    const pctChange = Math.round(((curr - prev) / prev) * 100);
    return { value: `${Math.abs(pctChange)}%`, positive: pctChange >= 0 };
  }, [streakHistory, range]);

  // Focus by project
  const projectMap = new Map(projects.map((p) => [p.id, p.name]));
  const projectColorMap = new Map(projects.map((p) => [p.name, p.color]));
  const projectFocus: Record<string, number> = {};
  const todayKey = dateKey(new Date());
  for (const t of tasks) {
    const name = projectMap.get(t.projectId) ?? "General";
    projectFocus[name] = (projectFocus[name] ?? 0) + (t.timeSpent ?? 0);
  }
  const todaySessionCount = streakHistory.days[todayKey]?.sessionCount ?? 0;
  const projectItems = Object.entries(projectFocus)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([label, value], i) => ({
      label,
      value,
      color: projectColorMap.get(label) || FALLBACK_COLORS[i % FALLBACK_COLORS.length],
    }));

  // Goal completion rate
  const goalDays = allDayKeys.filter((k) => streakHistory.days[k]?.goalMet).length;
  const goalRate = activeDays > 0 ? Math.round((goalDays / activeDays) * 100) : 0;

  // Best day of week
  const dayOfWeekSessions = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0, 0]; // Sun–Sat
    for (const k of allDayKeys) {
      const d = new Date(k + "T00:00:00");
      counts[d.getDay()] += streakHistory.days[k]?.sessionCount ?? 0;
    }
    return counts;
  }, [streakHistory, allDayKeys]);

  const bestDayIndex = dayOfWeekSessions.indexOf(Math.max(...dayOfWeekSessions));
  const bestDayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][bestDayIndex];

  // ── Render ──────────────────────────────────────────────

  if (!loaded) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0b1121]">
        <Navbar />
        <div className="max-w-[1280px] mx-auto px-4 py-12 text-center text-gray-500 dark:text-gray-400">
          <div className="w-8 h-8 border-4 border-slate-200 dark:border-[#243350] border-t-blue-500 rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b1121]">
      <Navbar />

      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Stats &amp; Analytics
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Track your focus habits and productivity trends
            </p>
          </div>
          {/* Range toggle */}
          <div className="flex gap-1.5 bg-gray-100 dark:bg-[#162a4a] rounded-lg p-1">
            {([7, 30] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 sm:px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                  range === r
                    ? "bg-white dark:bg-[#0f1b33] text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                {r}D
              </button>
            ))}
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <StatCard
            label="Total Sessions"
            value={String(totalSessions)}
            trend={trendData}
            accentBg="bg-blue-50 dark:bg-blue-900/30"
            accentText="text-blue-600 dark:text-blue-400"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
          />
          <StatCard
            label="Focus Time"
            value={formatMs(totalFocusMs)}
            accentBg="bg-emerald-50 dark:bg-emerald-900/30"
            accentText="text-emerald-600 dark:text-emerald-400"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            label="Current Streak"
            value={`${currentStreak}d`}
            accentBg="bg-orange-50 dark:bg-orange-900/30"
            accentText="text-orange-600 dark:text-orange-400"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              </svg>
            }
          />
          <StatCard
            label="Avg / Active Day"
            value={avgSessionsPerDay}
            accentBg="bg-violet-50 dark:bg-violet-900/30"
            accentText="text-violet-600 dark:text-violet-400"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
        </div>

        {/* Heatmap */}
        <div className="bg-white dark:bg-[#0f1b33] rounded-2xl p-5 sm:p-6 border border-gray-200 dark:border-[#1e3355] shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
              Activity
            </h2>
            <div className="flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-500">
              <span>Less</span>
              <div className="flex gap-[3px]">
                {["var(--heatmap-empty)", "var(--heatmap-l1)", "var(--heatmap-l2)", "var(--heatmap-l3)", "var(--heatmap-l4)"].map((c, i) => (
                  <div key={i} className="w-3 h-3 rounded-[3px]" style={{ backgroundColor: c }} />
                ))}
              </div>
              <span>More</span>
            </div>
          </div>
          <Heatmap streakHistory={streakHistory} weeks={range === 7 ? 12 : 20} />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
          {/* Sessions per day */}
          <div className="bg-white dark:bg-[#0f1b33] rounded-2xl p-5 sm:p-6 border border-gray-200 dark:border-[#1e3355] shadow-sm">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Sessions per Day
            </h2>
            <BarChart
              data={sessionsData}
              labelFn={range === 7 ? dayLabel : (k) => k.slice(8)}
              color="#3b82f6"
            />
          </div>

          {/* Focus time per day */}
          <div className="bg-white dark:bg-[#0f1b33] rounded-2xl p-5 sm:p-6 border border-gray-200 dark:border-[#1e3355] shadow-sm">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Focus Time per Day
            </h2>
            <BarChart
              data={focusData}
              labelFn={range === 7 ? dayLabel : (k) => k.slice(8)}
              valueSuffix="m"
              color="#10b981"
            />
          </div>
        </div>

        {/* Project breakdown + Today's activity row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
          {/* Project distribution donut + bars */}
          <div className="lg:col-span-2 bg-white dark:bg-[#0f1b33] rounded-2xl p-5 sm:p-6 border border-gray-200 dark:border-[#1e3355] shadow-sm">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-5">
              Focus by Project
            </h2>
            {projectItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
                <DonutChart items={projectItems} />
                <HorizontalBar items={projectItems} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-gray-500">
                <svg className="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
                <p className="text-sm">No focus time recorded yet</p>
              </div>
            )}
          </div>

          {/* Today's activity */}
          <div className="bg-white dark:bg-[#0f1b33] rounded-2xl p-5 sm:p-6 border border-gray-200 dark:border-[#1e3355] shadow-sm">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-1">
              Today&apos;s Activity
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              {todaySessionCount} session{todaySessionCount !== 1 ? "s" : ""} · {formatMs(todaySessionCount * workDuration)} focused
            </p>
            {todaySessionCount > 0 ? (
              <div className="space-y-3">
                {tasks
                  .filter((t) => t.sessions > 0 && (t.timeSpent ?? 0) > 0)
                  .sort((a, b) => (b.timeSpent ?? 0) - (a.timeSpent ?? 0))
                  .slice(0, 8)
                  .map((t) => {
                    const pName = projectMap.get(t.projectId) ?? "General";
                    return (
                      <div key={t.id} className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{t.title}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{pName} · {t.sessions} session{t.sessions !== 1 ? "s" : ""}</div>
                        </div>
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 tabular-nums">
                          {formatMs(t.timeSpent ?? 0)}
                        </span>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-gray-400 dark:text-gray-500">
                <svg className="w-10 h-10 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <p className="text-sm">No sessions yet today</p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom insights row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Goal completion */}
          <div className="bg-white dark:bg-[#0f1b33] rounded-2xl p-5 sm:p-6 border border-gray-200 dark:border-[#1e3355] shadow-sm">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Goal Completion
            </h2>
            <div className="flex items-center justify-center mb-4">
              <div className="relative w-28 h-28">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="10" className="text-gray-100 dark:text-[#1a2744]" />
                  <circle
                    cx="60" cy="60" r="50" fill="none"
                    strokeWidth="10" strokeLinecap="round"
                    className="text-emerald-500 dark:text-emerald-400 transition-all duration-700"
                    strokeDasharray={`${goalRate * 3.14} ${314 - goalRate * 3.14}`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">{goalRate}%</span>
                </div>
              </div>
            </div>
            <div className="text-center text-xs text-gray-500 dark:text-gray-400">
              {goalDays} of {activeDays} active days
            </div>
          </div>

          {/* Best day + insights */}
          <div className="bg-white dark:bg-[#0f1b33] rounded-2xl p-5 sm:p-6 border border-gray-200 dark:border-[#1e3355] shadow-sm">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Weekly Pattern
            </h2>
            <div className="flex items-end gap-1.5 h-24 mb-4">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => {
                const idx = i === 6 ? 0 : i + 1; // Mon=1..Sun=0
                const val = dayOfWeekSessions[idx];
                const max = Math.max(...dayOfWeekSessions, 1);
                const pct = (val / max) * 100;
                const isBest = idx === bestDayIndex && val > 0;
                return (
                  <div key={d} className="flex-1 flex flex-col items-center h-full justify-end">
                    <div
                      className={`w-full rounded-t-md transition-all duration-300 ${isBest ? "bg-blue-500 dark:bg-blue-400" : "bg-gray-200 dark:bg-[#1a2744]"}`}
                      style={{ height: `${Math.max(pct, val > 0 ? 6 : 2)}%` }}
                    />
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">{d.slice(0, 2)}</span>
                  </div>
                );
              })}
            </div>
            {Math.max(...dayOfWeekSessions) > 0 && (
              <p className="text-sm text-gray-600 dark:text-gray-300 text-center">
                Most productive on <span className="font-semibold text-blue-600 dark:text-blue-400">{bestDayName}s</span>
              </p>
            )}
          </div>

          {/* Overview stats */}
          <div className="bg-white dark:bg-[#0f1b33] rounded-2xl p-5 sm:p-6 border border-gray-200 dark:border-[#1e3355] shadow-sm">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Overview
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-[#162a4a] rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-gray-900 dark:text-white">{longestStreak}d</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Longest Streak</p>
              </div>
              <div className="bg-gray-50 dark:bg-[#162a4a] rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-gray-900 dark:text-white">{activeDays}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Active Days</p>
              </div>
              <div className="bg-gray-50 dark:bg-[#162a4a] rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-gray-900 dark:text-white">{goalDays}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Goals Met</p>
              </div>
              <div className="bg-gray-50 dark:bg-[#162a4a] rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-gray-900 dark:text-white">{tasks.length}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Total Tasks</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
