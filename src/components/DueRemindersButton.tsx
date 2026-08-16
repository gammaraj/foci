"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { loadTasks, loadProjects } from "@/lib/storage";
import type { Task } from "@/lib/types";
import { isActionableOverdue } from "@/lib/task-status";
import { formatOverdueChip, getDaysOverdue } from "@/components/task-list/utils";
import { isTasksAppPath } from "@/lib/task-view-url";

/** Ask TaskList on /app to show the Today/overdue filter (and optionally a task). */
export const VIEW_DUE_TASKS_EVENT = "foci-view-due-tasks";

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type DueItem = {
  task: Task;
  projectName: string;
  kind: "overdue" | "today";
  daysLate: number;
};

/**
 * In-app due / overdue tray — the real notification surface for deadlines.
 * Browser OS notifications (DueDateReminders) remain a secondary channel.
 */
export default function DueRemindersButton() {
  const pathname = usePathname();
  const router = useRouter();
  const [items, setItems] = useState<DueItem[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tasks, projects] = await Promise.all([loadTasks(), loadProjects()]);
      const today = todayStr();
      const byId = new Map(projects.map((p) => [p.id, p.name]));
      const next: DueItem[] = [];

      for (const task of tasks) {
        if (task.completed || task.archivedAt || !task.dueDate) continue;
        if (task.blocked || task.someday) continue;

        if (isActionableOverdue(task)) {
          next.push({
            task,
            projectName: byId.get(task.projectId) ?? "Project",
            kind: "overdue",
            daysLate: getDaysOverdue(task.dueDate),
          });
        } else if (task.dueDate === today) {
          next.push({
            task,
            projectName: byId.get(task.projectId) ?? "Project",
            kind: "today",
            daysLate: 0,
          });
        }
      }

      next.sort((a, b) => {
        if (a.kind !== b.kind) return a.kind === "overdue" ? -1 : 1;
        if (a.kind === "overdue") return b.daysLate - a.daysLate;
        return a.task.title.localeCompare(b.task.title);
      });
      setItems(next);
    } catch (err) {
      console.error("[Foci] Failed to load due reminders:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const interval = setInterval(() => void load(), 60_000);
    const onUpdate = () => void load();
    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    window.addEventListener("tempo-tasks-updated", onUpdate);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      window.removeEventListener("tempo-tasks-updated", onUpdate);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  useEffect(() => {
    if (!showPanel) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowPanel(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showPanel]);

  const overdueCount = items.filter((i) => i.kind === "overdue").length;
  const todayCount = items.filter((i) => i.kind === "today").length;
  const badgeCount = overdueCount > 0 ? overdueCount : todayCount;

  const openDueView = (taskId?: string) => {
    setShowPanel(false);
    const detail = { taskId };
    if (!isTasksAppPath(pathname)) {
      try {
        sessionStorage.setItem("foci-pending-due-view", JSON.stringify(detail));
      } catch {
        /* ignore */
      }
      router.push("/app");
      return;
    }
    window.dispatchEvent(new CustomEvent(VIEW_DUE_TASKS_EVENT, { detail }));
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => {
          setShowPanel((v) => !v);
          if (!showPanel) void load();
        }}
        className="relative touch-target-sm p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
        aria-label={
          badgeCount > 0
            ? `Due tasks: ${overdueCount} overdue, ${todayCount} due today`
            : "Due tasks — none overdue or due today"
        }
        aria-expanded={showPanel}
        title="Due & overdue"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {badgeCount > 0 && (
          <span
            className={`absolute -top-0.5 -right-0.5 min-w-[1.1rem] h-[1.1rem] px-0.5 flex items-center justify-center rounded-full text-[10px] font-bold text-white ${
              overdueCount > 0 ? "bg-rose-600" : "bg-orange-500"
            }`}
          >
            {badgeCount > 9 ? "9+" : badgeCount}
          </span>
        )}
      </button>

      {showPanel && (
        <div
          role="dialog"
          aria-label="Due and overdue tasks"
          className="absolute right-0 top-full mt-1.5 z-[80] w-[min(20rem,calc(100vw-1.5rem))] max-h-[min(24rem,70vh)] overflow-y-auto rounded-xl border border-slate-200 dark:border-[#243350] bg-white dark:bg-[#131d30] shadow-xl"
        >
          <div className="sticky top-0 flex items-center justify-between gap-2 px-3 py-2.5 border-b border-slate-200/80 dark:border-[#243350] bg-white/95 dark:bg-[#131d30]/95 backdrop-blur-sm">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Due & overdue</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {overdueCount} overdue · {todayCount} today
              </p>
            </div>
            <button
              type="button"
              onClick={() => openDueView()}
              className="shrink-0 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              View Today
            </button>
          </div>

          {loading && items.length === 0 ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <p className="px-3 py-6 text-sm text-center text-slate-500 dark:text-slate-400">
              Nothing overdue or due today. Nice.
            </p>
          ) : (
            <ul className="py-1">
              {items.map(({ task, projectName, kind, daysLate }) => (
                <li key={task.id}>
                  <button
                    type="button"
                    onClick={() => openDueView(task.id)}
                    className="w-full text-left px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-[#1a2d4a] transition-colors"
                  >
                    <div className="flex items-start gap-2 min-w-0">
                      <span
                        className={`mt-0.5 shrink-0 inline-flex items-center h-4 px-1.5 rounded text-[10px] font-bold tabular-nums ${
                          kind === "overdue"
                            ? "bg-rose-600 text-white"
                            : "bg-orange-500 text-white"
                        }`}
                      >
                        {kind === "overdue" ? formatOverdueChip(daysLate) : "Today"}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                          {task.title}
                        </span>
                        <span className="block text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {projectName}
                        </span>
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
