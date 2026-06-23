"use client";

import { useEffect, useRef, useCallback } from "react";
import { Task } from "@/lib/types";
import { loadTasks } from "@/lib/storage";

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function tomorrowStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const CHECK_INTERVAL = 60 * 60 * 1000; // re-check every hour

export default function DueDateReminders() {
  const lastCheckDateRef = useRef<string>("");

  const checkDueDates = useCallback(async () => {
    const today = todayStr();

    // Only send browser notifications once per day
    const shouldNotify = lastCheckDateRef.current !== today;
    lastCheckDateRef.current = today;

    const tomorrow = tomorrowStr();
    let tasks: Task[];
    try {
      tasks = await loadTasks();
    } catch {
      return;
    }

    const pending = tasks.filter((t) => t.dueDate && !t.completed && !t.archivedAt && !t.blocked && !t.someday);

    const notificationLines: string[] = [];

    for (const task of pending) {
      const due = task.dueDate!;
      let label: string | null = null;

      if (due < today) label = "Overdue";
      else if (due === today) label = "Due today";
      else if (due === tomorrow) label = "Due tomorrow";

      if (label && shouldNotify) {
        notificationLines.push(`• ${label}: ${task.title}`);
      }
    }

    // Browser notification (once per day)
    if (shouldNotify && notificationLines.length > 0) {
      sendBrowserNotification(notificationLines);
    }
  }, []);

  useEffect(() => {
    checkDueDates();
    const interval = setInterval(checkDueDates, CHECK_INTERVAL);

    // Also re-check when tasks change
    const handleUpdate = () => checkDueDates();
    window.addEventListener("tempo-tasks-updated", handleUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener("tempo-tasks-updated", handleUpdate);
    };
  }, [checkDueDates]);

  return null;
}

function sendBrowserNotification(lines: string[]) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const body = lines.join("\n");
  const title = "Foci — Task Reminders";
  const options = {
    body,
    icon: "/favicon.svg",
    tag: "foci-due-date-reminder",
  };

  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then((reg) => {
      reg.showNotification(title, options);
    }).catch(() => {
      new Notification(title, options);
    });
  } else {
    new Notification(title, options);
  }
}
