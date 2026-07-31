import type { ReactNode } from "react";

export type TaskViewMode = "bucket" | "list" | "calendar" | "card" | "plan";

export interface TaskListProps {
  activeTaskId: string | null;
  onSelectTask: (taskId: string | null) => void;
  onStartTask: (taskId: string) => void;
  onCompleteTask: (taskId: string) => number;
  isTimerRunning: boolean;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  focusMode?: boolean;
  onOpenSettings?: () => void;
  /** Music + timer strip rendered at the top of the Tasks card. */
  focusStrip?: ReactNode;
}
