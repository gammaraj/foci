export type TaskViewMode = "bucket" | "list" | "calendar" | "plan";

export interface TaskListProps {
  activeTaskId: string | null;
  onSelectTask: (taskId: string | null) => void;
  onStartTask: (taskId: string) => void;
  onCompleteTask: (taskId: string) => number;
  isTimerRunning: boolean;
  focusProjectId?: string | null;
  onFocusProject?: (projectId: string | null) => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  focusMode?: boolean;
  onOpenSettings?: () => void;
}
