"use client";

import React, { useState, useEffect, useLayoutEffect, useCallback, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Task, Project, Settings, DEFAULT_SETTINGS, DEFAULT_PROJECT, DEFAULT_PROJECT_ID, ALL_PROJECTS_ID, TODAY_FILTER_ID, THIS_WEEK_FILTER_ID, THIS_MONTH_FILTER_ID, THIS_YEAR_FILTER_ID, Subtask, PROJECT_COLORS, RecurrenceType, TaskPriority } from "@/lib/types";
import { loadTasks, saveTasks, saveTask as saveOneTask, loadProjects, saveProjects, saveSelectedProjectId, deleteTask as removeTaskFromDB, deleteTasks as removeTasksFromDB, deleteProject as removeProjectFromDB, loadSettings, getSharedProjects, loadSharedProjectTasks, updateSharedTask, leaveProject, SharedProject, isSharedProjectFn, loadTaskViewPreferences, saveTaskViewPreferences } from "@/lib/storage";
import { trackTaskAdded, trackTaskCompleted, trackTaskDeleted } from "@/lib/analytics";
import dynamic from "next/dynamic";
import ConfirmModal from "@/components/ConfirmModal";
import ShareProjectModal from "@/components/ShareProjectModal";
import { TASK_TEMPLATES, templateToTasks } from "@/lib/templates";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/ToastProvider";
import { getToday, formatDateLocal } from "@/lib/dates";
import TaskPanelMenu from "@/components/TaskPanelMenu";

const SmartPlan = dynamic(() => import("@/components/SmartPlan"));
import TaskCalendarView from "@/components/task-list/TaskCalendarView";
import type { TaskListProps, TaskViewMode } from "@/components/task-list/types";
import {
  DEFAULT_VIEW_CHANGED_EVENT,
  resolveInitialTaskView,
  type DefaultTaskView,
} from "@/lib/task-view-preference";
import TaskBucketView from "@/components/task-list/TaskBucketView";
import TaskCardView from "@/components/task-list/TaskCardView";
import { applyBucketDrop, moveBucketTaskInLane, moveCardTaskInProject, moveCardTaskInProjectByDirection, type BucketDropTarget } from "@/components/task-list/bucket-order";
import { TaskDetailPanel } from "@/components/task-list/TaskDetailPanel";
import { TaskSubtaskSection } from "@/components/task-list/TaskSubtaskSection";
import { TaskExpansionDrawer } from "@/components/task-list/TaskExpansionDrawer";
import ProjectManageView from "@/components/task-list/ProjectManageView";
import OpenTaskList from "@/components/task-list/OpenTaskList";
import {
  MAX_TASK_TITLE,
  MAX_PROJECT_NAME,
  MAX_VISIBLE_PROJECT_TABS,
  formatDuration,
  formatDueDate,
  isDueDateOverdue,
  openDatePicker,
  getNextDueDate,
  projectTabTooltip,
  projectTabLabel,
  sortProjectsForDisplay,
  reorderProjects,
  moveProjectInDisplayOrder,
} from "@/components/task-list/utils";
import { getTaskListSection, getTaskListSectionOrder, isActionableOverdue } from "@/lib/task-status";
import { ProjectTabName } from "@/components/task-list/ProjectTabName";

/** Neutral active state for time/view filters (not a primary CTA). */
const FILTER_TAB_ACTIVE =
  "bg-white dark:bg-[#1a2d4a] text-slate-800 dark:text-slate-100 shadow-sm ring-1 ring-slate-300/70 dark:ring-[#3a5070] font-semibold";
const FILTER_TAB_INACTIVE =
  "text-slate-600 dark:text-white/80 hover:text-slate-800 dark:hover:text-white hover:bg-slate-300/60 dark:hover:bg-white/10";

/** Cyan-accent active state so layout view is easy to spot. */
const VIEW_TAB_ACTIVE =
  "bg-white dark:bg-[#1a2d4a] text-cyan-700 dark:text-cyan-300 shadow-sm ring-1 ring-cyan-400/70 dark:ring-cyan-500/55 font-semibold";
const VIEW_TAB_INACTIVE =
  "text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white hover:bg-slate-300/60 dark:hover:bg-white/10";

/** Soft outline for project scope (distinct from Add / Start buttons). */
const PROJECT_TAB_ACTIVE =
  "bg-white dark:bg-[#1a2d4a] text-slate-800 dark:text-slate-100 shadow-sm ring-1 ring-cyan-400/50 dark:ring-cyan-500/45 font-semibold";
const PROJECT_TAB_INACTIVE =
  "text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-[#131d30] hover:bg-slate-200 dark:hover:bg-[#1a2d4a]";

export default function TaskList({
  activeTaskId,
  onSelectTask,
  onStartTask,
  onCompleteTask,
  isTimerRunning,
  focusProjectId,
  onFocusProject,
  isFullscreen,
  onToggleFullscreen,
  focusMode,
  onOpenSettings,
}: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [tasksReady, setTasksReady] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskProjectId, setNewTaskProjectId] = useState<string>(DEFAULT_PROJECT_ID);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  // Project state
  const [projects, setProjects] = useState<Project[]>([DEFAULT_PROJECT]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(ALL_PROJECTS_ID);
  /** When viewing Today/Week/Month/Year, filters tasks within that scope (All projects or one project). */
  const [projectFilterId, setProjectFilterId] = useState<string>(ALL_PROJECTS_ID);
  const [projectManageOpen, setProjectManageOpen] = useState(false);
  const [bucketJumpProjectId, setBucketJumpProjectId] = useState("");
  const [bucketScrollToken, setBucketScrollToken] = useState(0);
  const [showOverflowProjectMenu, setShowOverflowProjectMenu] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [showAddProject, setShowAddProject] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editProjectName, setEditProjectName] = useState("");
  const [editingProjectDescId, setEditingProjectDescId] = useState<string | null>(null);
  const [editProjectDesc, setEditProjectDesc] = useState("");
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [noDueDateExpanded, setNoDueDateExpanded] = useState(false);
  const [somedayExpanded, setSomedayExpanded] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editSubtaskTitle, setEditSubtaskTitle] = useState("");
  const [editingDescId, setEditingDescId] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const [dragProjectId, setDragProjectId] = useState<string | null>(null);
  const [dragOverProjectId, setDragOverProjectId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<TaskViewMode>("card");

  useEffect(() => {
    const onDefaultViewChanged = (e: Event) => {
      const mode = (e as CustomEvent<DefaultTaskView>).detail;
      setViewMode(mode);
    };
    window.addEventListener(DEFAULT_VIEW_CHANGED_EVENT, onDefaultViewChanged);
    return () => window.removeEventListener(DEFAULT_VIEW_CHANGED_EVENT, onDefaultViewChanged);
  }, []);

  const persistTaskView = useCallback((mode: TaskViewMode, explicit = true) => {
    if (mode === "plan") return;
    saveTaskViewPreferences({
      lastTaskView: mode,
      taskViewExplicit: explicit,
    }).catch((err) => console.error("[Foci] Failed to save task view preference:", err));
  }, []);

  const viewBeforePlanRef = useRef<TaskViewMode>("card");
  const viewBeforeManageRef = useRef<TaskViewMode>("card");
  const router = useRouter();
  const searchParams = useSearchParams();

  const syncProjectsUrl = useCallback(
    (open: boolean) => {
      const hasProjects = searchParams.get("projects") === "1";
      if (open && !hasProjects) {
        router.replace("/app?projects=1", { scroll: false });
      } else if (!open && hasProjects) {
        router.replace("/app", { scroll: false });
      }
    },
    [router, searchParams]
  );

  const openProjectManage = useCallback(() => {
    viewBeforeManageRef.current =
      viewMode === "calendar" || viewMode === "list" || viewMode === "bucket" || viewMode === "card"
        ? viewMode
        : "card";
    setProjectManageOpen(true);
    syncProjectsUrl(true);
  }, [viewMode, syncProjectsUrl]);

  const closeProjectManage = useCallback(() => {
    setProjectManageOpen(false);
    setEditingProjectId(null);
    syncProjectsUrl(false);
  }, [syncProjectsUrl]);

  const [cameFromBucket, setCameFromBucket] = useState(false);

  const expandProjectFromBucket = useCallback((projectId: string) => {
    selectProject(projectId);
    setViewMode("list");
    setCameFromBucket(true);
    persistTaskView("list");
  }, [persistTaskView]);

  const backToBuckets = useCallback(() => {
    selectProject(ALL_PROJECTS_ID);
    setViewMode("bucket");
    setCameFromBucket(false);
    persistTaskView("bucket");
  }, [persistTaskView]);

  const selectViewMode = useCallback((mode: TaskViewMode) => {
    setViewMode(mode);
    setCameFromBucket(false);
    setExpandedTaskId(null);
    setNewSubtaskTitle("");
    setEditingSubtaskId(null);
    if (mode !== "plan") {
      persistTaskView(mode);
    }
  }, [persistTaskView]);

  // Default due date when adding from Today / Week / Month / Year views
  useEffect(() => {
    const inTimeScope =
      selectedProjectId === TODAY_FILTER_ID ||
      selectedProjectId === THIS_WEEK_FILTER_ID ||
      selectedProjectId === THIS_MONTH_FILTER_ID ||
      selectedProjectId === THIS_YEAR_FILTER_ID;
    setNewTaskDueDate(inTimeScope ? getToday() : "");
  }, [selectedProjectId]);

  const [planSettings, setPlanSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarSelectedDay, setCalendarSelectedDay] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
  } | null>(null);
  const [undoTask, setUndoTask] = useState<{ task: Task; timer: ReturnType<typeof setTimeout> } | null>(null);
  
  // Collaboration state
  const [sharedProjects, setSharedProjects] = useState<SharedProject[]>([]);
  const [sharedTasks, setSharedTasks] = useState<Record<string, Task[]>>({});
  const [shareModalProject, setShareModalProject] = useState<Project | null>(null);
  const [selectedSharedProject, setSelectedSharedProject] = useState<SharedProject | null>(null);
  
  const projectMenuRef = useRef<HTMLDivElement>(null);
  const projectTabsContainerRef = useRef<HTMLDivElement>(null);
  const allProjectsTabRef = useRef<HTMLButtonElement>(null);
  const projectTabsToolbarRef = useRef<HTMLDivElement>(null);
  const projectTabMeasureRef = useRef<HTMLDivElement>(null);
  const projectDidDragRef = useRef(false);
  const [maxVisibleProjectTabs, setMaxVisibleProjectTabs] = useState(MAX_VISIBLE_PROJECT_TABS);

  useEffect(() => {
    const open = () => openProjectManage();
    const close = () => closeProjectManage();
    window.addEventListener("foci-open-project-menu", open);
    window.addEventListener("foci-close-project-menu", close);
    return () => {
      window.removeEventListener("foci-open-project-menu", open);
      window.removeEventListener("foci-close-project-menu", close);
    };
  }, [openProjectManage, closeProjectManage]);

  useEffect(() => {
    const shouldOpen = searchParams.get("projects") === "1";
    setProjectManageOpen((wasOpen) => {
      if (wasOpen === shouldOpen) return wasOpen;
      if (shouldOpen) {
        viewBeforeManageRef.current =
          viewMode === "calendar" || viewMode === "list" || viewMode === "bucket" || viewMode === "card"
            ? viewMode
            : "card";
      }
      return shouldOpen;
    });
    if (!shouldOpen) {
      setEditingProjectId(null);
    }
  }, [searchParams, viewMode]);
  const newTaskDueDateInputRef = useRef<HTMLInputElement>(null);

  // Close project menus on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (projectMenuRef.current && !projectMenuRef.current.contains(e.target as Node)) {
        closeProjectManage();
        setShowOverflowProjectMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [closeProjectManage]);

  // Lock project selection in focus mode
  useEffect(() => {
    if (focusProjectId) {
      setSelectedProjectId(focusProjectId);
    }
  }, [focusProjectId]);

  const userId = user?.id;
  useEffect(() => {
    // Wait until auth has resolved so we use the correct adapter (Supabase vs localStorage)
    if (authLoading) return;

    // Load projects (and shared projects for logged-in users)
    const loadData = async () => {
      try {
        const [existingProjects, existing, taskViewPrefs] = await Promise.all([
          loadProjects(),
          loadTasks(),
          loadTaskViewPreferences(),
        ]);
        setProjects(existingProjects);
        setViewMode(resolveInitialTaskView(taskViewPrefs));

        // Seed sample tasks only for logged-out users with no tasks
        if (existing.length === 0 && !user) {
          const samples: Task[] = [
            { id: crypto.randomUUID(), title: "Review project requirements", completed: false, sessions: 0, timeSpent: 0, createdAt: Date.now(), projectId: DEFAULT_PROJECT_ID, subtasks: [] },
            { id: crypto.randomUUID(), title: "Draft design mockups", completed: false, sessions: 0, timeSpent: 0, createdAt: Date.now(), projectId: DEFAULT_PROJECT_ID, subtasks: [] },
            { id: crypto.randomUUID(), title: "Write unit tests", completed: false, sessions: 0, timeSpent: 0, createdAt: Date.now(), projectId: DEFAULT_PROJECT_ID, subtasks: [] },
          ];
          saveTasks(samples).catch((err) => {
            console.error("[Foci] Failed to save sample tasks:", err);
          });
          setTasks(samples);
        } else {
          // Migrate tasks missing projectId
          const migrated = existing.map((t) => ({
            ...t,
            projectId: t.projectId || DEFAULT_PROJECT_ID,
          }));
          if (migrated.some((t, i) => t.projectId !== existing[i]?.projectId)) {
            saveTasks(migrated).catch((err) => {
              console.error("[Foci] Failed to save migrated tasks:", err);
            });
          }
          setTasks(migrated);
        }

        // Load shared projects for authenticated users
        if (user) {
          try {
            const shared = await getSharedProjects();
            setSharedProjects(shared);
          } catch (err) {
            console.error("[Foci] Failed to load shared projects:", err);
          }
        }

      } catch (err) {
        console.error("[Foci] Failed to load data:", err);
      } finally {
        setTasksReady(true);
      }
    };

    loadData();

    const handleUpdate = () => {
      loadTasks().then(setTasks).catch((err) => {
        console.error("[Foci] Failed to reload tasks:", err);
      });
      loadProjects().then(setProjects).catch((err) => {
        console.error("[Foci] Failed to reload projects:", err);
      });
      // Also reload shared projects
      if (user) {
        getSharedProjects().then(setSharedProjects).catch((err) => {
          console.error("[Foci] Failed to reload shared projects:", err);
        });
      }
    };
    window.addEventListener("tempo-tasks-updated", handleUpdate);

    // Re-sync from Supabase when user switches back to this tab
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        handleUpdate();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("tempo-tasks-updated", handleUpdate);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, userId]);

  // Listen for session completion events from the timer and update task state atomically
  useEffect(() => {
    const handleSessionComplete = (e: Event) => {
      const { taskId, elapsed } = (e as CustomEvent<{ taskId: string; elapsed: number }>).detail;
      setTasks(prev => {
        const updated = prev.map(t =>
          t.id === taskId
            ? { ...t, sessions: t.sessions + 1, timeSpent: (t.timeSpent || 0) + elapsed }
            : t
        );
        const changed = updated.find((t) => t.id === taskId);
        if (changed) {
          saveOneTask(changed).catch(err => {
            console.error("[Foci] Failed to save session update:", err);
          });
        }
        return updated;
      });
    };
    window.addEventListener("tempo-session-complete", handleSessionComplete);
    return () => window.removeEventListener("tempo-session-complete", handleSessionComplete);
  }, []);

  const persist = useCallback(async (updated: Task[], changedTask?: Task) => {
    setTasks(updated);
    try {
      if (changedTask) {
        await saveOneTask(changedTask);
      } else {
        await saveTasks(updated);
      }
      window.dispatchEvent(new Event("tempo-tasks-updated"));
    } catch (err) {
      console.error("[Foci] Failed to save tasks:", err);
      showToast("Failed to save tasks. Changes may be lost.", "error");
    }
  }, [showToast]);

  /** Save a single task update (avoids re-upserting the entire array). */
  const persistOne = useCallback(async (updated: Task[], changedTask: Task) => {
    setTasks(updated);
    try {
      await saveOneTask(changedTask);
    } catch (err) {
      console.error("[Foci] Failed to save task:", err);
      showToast("Failed to save task. Changes may be lost.", "error");
    }
  }, [showToast]);

  const persistProjects = useCallback((updated: Project[]) => {
    setProjects(updated);
    saveProjects(updated).catch((err) => {
      console.error("[Foci] Failed to save projects:", err);
      showToast("Failed to save projects.", "error");
    });
  }, [showToast]);

  const selectProject = (id: string) => {
    setSelectedProjectId(id);
    saveSelectedProjectId(id).catch((err) => {
      console.error("[Foci] Failed to save selected project:", err);
    });
    closeProjectManage();
    setShowOverflowProjectMenu(false);
  };

  const selectProjectScope = (projectId: string) => {
    const timeScope =
      selectedProjectId === TODAY_FILTER_ID ||
      selectedProjectId === THIS_WEEK_FILTER_ID ||
      selectedProjectId === THIS_MONTH_FILTER_ID ||
      selectedProjectId === THIS_YEAR_FILTER_ID;
    if (timeScope) {
      setProjectFilterId(projectId);
      closeProjectManage();
      setShowOverflowProjectMenu(false);
      return;
    }
    selectProject(projectId);
  };

  // Select a shared project and load its tasks
  const selectSharedProject = async (shared: SharedProject) => {
    setSelectedSharedProject(shared);
    setSelectedProjectId(`shared:${shared._ownerId}:${shared.id}`);
    closeProjectManage();
    
    // Load tasks for this shared project if not already loaded
    const key = `${shared._ownerId}:${shared.id}`;
    if (!sharedTasks[key]) {
      try {
        const tasks = await loadSharedProjectTasks(shared.id, shared._ownerId);
        setSharedTasks((prev) => ({ ...prev, [key]: tasks }));
      } catch (err) {
        console.error("[Foci] Failed to load shared project tasks:", err);
        showToast("Failed to load shared project tasks", "error");
      }
    }
  };

  // Leave a shared project
  const handleLeaveSharedProject = async (shared: SharedProject) => {
    setPendingConfirm({
      title: "Leave project",
      message: `Are you sure you want to leave "${shared.name}"? You will lose access to this project and its tasks.`,
      confirmLabel: "Leave",
      onConfirm: async () => {
        try {
          await leaveProject(shared.id, shared._ownerId);
          setSharedProjects((prev) => prev.filter((p) => !(p.id === shared.id && p._ownerId === shared._ownerId)));
          // Clear selected if it was the shared project
          if (selectedSharedProject?.id === shared.id && selectedSharedProject?._ownerId === shared._ownerId) {
            setSelectedSharedProject(null);
            setSelectedProjectId(TODAY_FILTER_ID);
          }
          showToast("Left shared project", "success");
        } catch (err) {
          showToast("Failed to leave project", "error");
        }
        setPendingConfirm(null);
      },
    });
  };

  // Update a task in a shared project
  const updateTaskInSharedProject = async (task: Task, ownerId: string) => {
    try {
      await updateSharedTask(task, ownerId);
      const key = `${ownerId}:${task.projectId}`;
      setSharedTasks((prev) => ({
        ...prev,
        [key]: (prev[key] || []).map((t) => (t.id === task.id ? task : t)),
      }));
    } catch (err) {
      console.error("[Foci] Failed to update shared task:", err);
      showToast("Failed to update task", "error");
    }
  };

  // Check if currently viewing a shared project
  const isViewingSharedProject = selectedProjectId.startsWith("shared:");
  const currentSharedProjectTasks = selectedSharedProject
    ? sharedTasks[`${selectedSharedProject._ownerId}:${selectedSharedProject.id}`] || []
    : [];

  const addProject = () => {
    const name = newProjectName.trim().slice(0, MAX_PROJECT_NAME);
    if (!name) return;
    const usedColors = projects.map((p) => p.color).filter(Boolean);
    const nextColor = PROJECT_COLORS.find((c) => !usedColors.includes(c)) ?? PROJECT_COLORS[projects.length % PROJECT_COLORS.length];
    const maxOrder = Math.max(0, ...projects.map((p) => p.order ?? 0));
    const project: Project = {
      id: crypto.randomUUID(),
      name,
      color: nextColor,
      order: maxOrder + 1,
      createdAt: Date.now(),
    };
    persistProjects([...projects, project]);
    setNewProjectName("");
    selectProject(project.id);
  };

  const startEditingProject = (p: Project) => {
    setEditingProjectId(p.id);
    setEditProjectName(p.name);
  };

  const saveProjectEdit = () => {
    const name = editProjectName.trim().slice(0, MAX_PROJECT_NAME);
    if (!name || !editingProjectId) return;
    persistProjects(
      projects.map((p) => (p.id === editingProjectId ? { ...p, name } : p))
    );
    setEditingProjectId(null);
  };

  const saveProjectDesc = () => {
    if (!editingProjectDescId) return;
    const desc = editProjectDesc.trim();
    persistProjects(
      projects.map((p) => (p.id === editingProjectDescId ? { ...p, description: desc || undefined } : p))
    );
    setEditingProjectDescId(null);
  };

  const updateProjectColor = (id: string, color: string) => {
    persistProjects(projects.map((p) => (p.id === id ? { ...p, color } : p)));
  };

  const updateProjectDueDate = (id: string, dueDate: string | undefined) => {
    persistProjects(projects.map((p) => (p.id === id ? { ...p, dueDate } : p)));
  };

  const toggleProjectFavorite = (id: string) => {
    persistProjects(
      projects.map((p) => (p.id === id ? { ...p, favorite: !p.favorite } : p))
    );
  };

  const handleProjectDragStart = (projectId: string) => {
    projectDidDragRef.current = false;
    setDragProjectId(projectId);
  };

  const handleProjectDragOver = (e: React.DragEvent, projectId: string) => {
    e.preventDefault();
    projectDidDragRef.current = true;
    setDragOverProjectId(projectId);
  };

  const handleProjectDrop = (targetId: string) => {
    if (!dragProjectId || dragProjectId === targetId) {
      setDragProjectId(null);
      setDragOverProjectId(null);
      return;
    }
    const updated = reorderProjects(projects, dragProjectId, targetId);
    if (updated) persistProjects(updated);
    setDragProjectId(null);
    setDragOverProjectId(null);
  };

  const handleProjectDragEnd = () => {
    setDragProjectId(null);
    setDragOverProjectId(null);
    window.setTimeout(() => {
      projectDidDragRef.current = false;
    }, 0);
  };

  const handleMoveProject = (projectId: string, direction: "up" | "down") => {
    const updated = moveProjectInDisplayOrder(projects, projectId, direction);
    if (updated) persistProjects(updated);
  };

  const toggleProjectArchived = (id: string) => {
    if (id === DEFAULT_PROJECT_ID) return;
    const project = projects.find((p) => p.id === id);
    if (!project) return;
    const newArchived = !project.archived;
    persistProjects(projects.map((p) => (p.id === id ? { ...p, archived: newArchived } : p)));
    if (newArchived && selectedProjectId === id) selectProject(DEFAULT_PROJECT_ID);
  };

  const deleteProject = async (id: string) => {
    if (id === DEFAULT_PROJECT_ID) return;
    const project = projects.find((p) => p.id === id);
    setPendingConfirm({
      title: "Delete project",
      message: `Delete "${project?.name ?? ""}"? Tasks will be moved to General.`,
      confirmLabel: "Delete",
      onConfirm: async () => {
        setPendingConfirm(null);
        const updated = tasks.map((t) =>
          t.projectId === id ? { ...t, projectId: DEFAULT_PROJECT_ID } : t
        );
        persist(updated);
        persistProjects(projects.filter((p) => p.id !== id));
        try {
          await removeProjectFromDB(id);
        } catch (err) {
          console.error("[Foci] Failed to delete project:", err);
          showToast("Failed to delete project.", "error");
        }
        if (selectedProjectId === id) selectProject(DEFAULT_PROJECT_ID);
      },
    });
  };

  const addTaskWithTitle = (titleRaw: string, dueDateOverride?: string, projectIdOverride?: string) => {
    const title = titleRaw.trim().slice(0, MAX_TASK_TITLE);
    if (!title) return;

    const addingInTimeScope =
      selectedProjectId === TODAY_FILTER_ID ||
      selectedProjectId === THIS_WEEK_FILTER_ID ||
      selectedProjectId === THIS_MONTH_FILTER_ID ||
      selectedProjectId === THIS_YEAR_FILTER_ID;

    const dueDate =
      dueDateOverride ??
      (newTaskDueDate ||
        (addingInTimeScope ? getToday() : undefined) ||
        (viewMode === "calendar" && calendarSelectedDay ? calendarSelectedDay : undefined));

    const projectId =
      projectIdOverride ??
      (addingInTimeScope
        ? projectFilterId !== ALL_PROJECTS_ID
          ? projectFilterId
          : DEFAULT_PROJECT_ID
        : selectedProjectId === ALL_PROJECTS_ID
          ? DEFAULT_PROJECT_ID
          : selectedProjectId);

    // For tasks without a due date, place them at the top by assigning an order
    // value below all existing manually-ordered tasks
    let newOrder: number | undefined;
    if (!dueDate) {
      const orderedNoDueDateOrders = tasks
        .filter((t) => !t.completed && !t.archivedAt && !t.dueDate && t.order != null)
        .map((t) => t.order as number);
      if (orderedNoDueDateOrders.length > 0) {
        newOrder = Math.min(...orderedNoDueDateOrders) - 1;
      }
    }

    const task: Task = {
      id: crypto.randomUUID(),
      title,
      completed: false,
      sessions: 0,
      timeSpent: 0,
      createdAt: Date.now(),
      projectId,
      subtasks: [],
      ...(dueDate ? { dueDate } : {}),
      ...(newOrder != null ? { order: newOrder } : {}),
    };

    persist([...tasks, task], task);
    trackTaskAdded();
    setNewTaskTitle("");
    setNewTaskDueDate("");
    setExpandedTaskId(task.id);
  };

  const addTask = () => addTaskWithTitle(newTaskTitle, undefined, newTaskProjectId);

  const toggleComplete = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const isCompleting = !task.completed;
    // If completing the active task, stop timer and save elapsed time
    let elapsed = 0;
    if (isCompleting && activeTaskId === id) {
      elapsed = onCompleteTask(id);
    }
    let updated = tasks.map((t) =>
      t.id === id
        ? { ...t, completed: !t.completed, timeSpent: (t.timeSpent || 0) + elapsed }
        : t
    );
    const changed = updated.find((t) => t.id === id)!;
    if (isCompleting) {
      trackTaskCompleted((changed.timeSpent || 0));
      const snapshot = tasks;
      showToast(
        task.recurrence ? "Task completed! Next occurrence created." : "Task completed!",
        "success",
        {
          label: "Undo",
          onClick: () => persist(snapshot),
        }
      );
      if (task.recurrence) {
        const nextTask: Task = {
          id: crypto.randomUUID(),
          title: task.title,
          completed: false,
          sessions: 0,
          timeSpent: 0,
          createdAt: Date.now(),
          projectId: task.projectId,
          subtasks: (task.subtasks || []).map((s) => ({ ...s, id: crypto.randomUUID(), completed: false })),
          description: task.description,
          dueDate: getNextDueDate(task.dueDate, task.recurrence),
          recurrence: task.recurrence,
        };
        updated = [...updated, nextTask];
        persist(updated, changed);
        saveOneTask(nextTask).catch((err) => console.error("[Foci] Failed to save recurring task:", err));
      } else {
        persistOne(updated, changed);
      }
    } else {
      persistOne(updated, changed);
    }
    if (activeTaskId === id) onSelectTask(null);
  };

  const deleteTask = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    setPendingConfirm({
      title: "Delete task",
      message: `Delete "${task?.title ?? "this task"}"? This cannot be undone.`,
      confirmLabel: "Delete",
      onConfirm: async () => {
        setPendingConfirm(null);
        trackTaskDeleted();
        persist(tasks.filter((t) => t.id !== id));
        try {
          await removeTaskFromDB(id);
        } catch (err) {
          console.error("[Foci] Failed to delete task:", err);
          showToast("Failed to delete task.", "error");
        }
        if (activeTaskId === id) onSelectTask(null);
      },
    });
  };

  const setDueDate = (id: string, date: string | undefined) => {
    const updated = tasks.map((t) => (t.id === id ? { ...t, dueDate: date } : t));
    const changed = updated.find((t) => t.id === id)!;
    persistOne(updated, changed);
  };

  const snoozeToToday = (id: string) => {
    setDueDate(id, getToday());
    showToast("Moved to today");
  };

  const startEditing = (task: Task) => {
    setEditingId(task.id);
    setEditTitle(task.title);
  };

  const saveEdit = (id: string) => {
    const title = editTitle.trim().slice(0, MAX_TASK_TITLE);
    if (!title) return;
    const updated = tasks.map((t) =>
      t.id === id ? { ...t, title } : t
    );
    const changed = updated.find((t) => t.id === id)!;
    persistOne(updated, changed);
    setEditingId(null);
  };

  const clearCompleted = async () => {
    const matchesProject = (t: Task) => isAllProjects || t.projectId === selectedProjectId;
    const toRemove = tasks.filter((t) => t.completed && matchesProject(t)).map((t) => t.id);
    persist(tasks.filter((t) => !(t.completed && matchesProject(t))));
    try {
      await removeTasksFromDB(toRemove);
    } catch (err) {
      console.error("[Foci] Failed to clear completed tasks:", err);
    }
  };

  const archiveCompleted = () => {
    const now = Date.now();
    const matchesProject = (t: Task) => isAllProjects || t.projectId === selectedProjectId;
    const updated = tasks.map((t) =>
      t.completed && matchesProject(t) && !t.archivedAt
        ? { ...t, archivedAt: now }
        : t
    );
    persist(updated);
  };

  const unarchiveTask = (id: string) => {
    const updated = tasks.map((t) =>
      t.id === id ? { ...t, archivedAt: undefined } : t
    );
    const changed = updated.find((t) => t.id === id)!;
    persistOne(updated, changed);
  };

  const deleteArchivedTasks = async () => {
    setPendingConfirm({
      title: "Delete archived tasks",
      message: `Delete ${archivedTasks.length} archived task${archivedTasks.length !== 1 ? "s" : ""}? This cannot be undone.`,
      confirmLabel: "Delete all",
      onConfirm: async () => {
        setPendingConfirm(null);
        const matchesProject = (t: Task) => isAllProjects || t.projectId === selectedProjectId;
        const toRemove = tasks.filter((t) => t.archivedAt && matchesProject(t)).map((t) => t.id);
        persist(tasks.filter((t) => !(t.archivedAt && matchesProject(t))));
        try {
          await removeTasksFromDB(toRemove);
        } catch (err) {
          console.error("[Foci] Failed to delete archived tasks:", err);
          showToast("Failed to delete archived tasks.", "error");
        }
      },
    });
  };

  const handleDragStart = (taskId: string) => {
    setDragTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent, taskId: string) => {
    e.preventDefault();
    setDragOverTaskId(taskId);
  };

  const applyTaskOrder = (ordered: Task[]) => {
    const orderMap = new Map<string, number>();
    ordered.forEach((t, i) => orderMap.set(t.id, i));
    const updated = tasks.map((t) =>
      orderMap.has(t.id) ? { ...t, order: orderMap.get(t.id)! } : t
    );
    persist(updated);
  };

  const createTaskListDnD = (taskList: Task[]) => ({
    onDrop: (targetId: string) => {
      if (!dragTaskId || dragTaskId === targetId) {
        setDragTaskId(null);
        setDragOverTaskId(null);
        return;
      }
      const ordered = [...taskList];
      const fromIdx = ordered.findIndex((t) => t.id === dragTaskId);
      const toIdx = ordered.findIndex((t) => t.id === targetId);
      if (fromIdx === -1 || toIdx === -1) {
        setDragTaskId(null);
        setDragOverTaskId(null);
        return;
      }
      const [moved] = ordered.splice(fromIdx, 1);
      ordered.splice(toIdx, 0, moved);
      applyTaskOrder(ordered);
      setDragTaskId(null);
      setDragOverTaskId(null);
    },
    onMoveTask: (taskId: string, direction: "up" | "down") => {
      const ordered = [...taskList];
      const idx = ordered.findIndex((t) => t.id === taskId);
      if (idx === -1) return;
      const targetIdx = direction === "up" ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= ordered.length) return;
      [ordered[idx], ordered[targetIdx]] = [ordered[targetIdx], ordered[idx]];
      applyTaskOrder(ordered);
    },
  });

  const handleDragEnd = () => {
    setDragTaskId(null);
    setDragOverTaskId(null);
  };

  const handleCardTaskDrop = (projectId: string, targetTaskId: string) => {
    if (!dragTaskId || dragTaskId === targetTaskId) {
      handleDragEnd();
      return;
    }
    const dragged = tasks.find((t) => t.id === dragTaskId);
    if (!dragged || dragged.projectId !== projectId) {
      handleDragEnd();
      return;
    }
    const updated = moveCardTaskInProject(
      tasks,
      projectId,
      dragTaskId,
      targetTaskId,
      activeTaskId
    );
    if (updated) persist(updated);
    handleDragEnd();
  };

  const handleCardTaskMove = (projectId: string, taskId: string, direction: "up" | "down") => {
    const updated = moveCardTaskInProjectByDirection(tasks, projectId, taskId, direction, activeTaskId);
    if (updated) persist(updated);
  };

  // Subtask helpers
  const addSubtask = (taskId: string) => {
    const title = newSubtaskTitle.trim().slice(0, MAX_TASK_TITLE);
    if (!title) return;
    const subtask: Subtask = { id: crypto.randomUUID(), title, completed: false };
    const updated = tasks.map((t) =>
      t.id === taskId ? { ...t, subtasks: [...(t.subtasks || []), subtask] } : t
    );
    const changed = updated.find((t) => t.id === taskId)!;
    persistOne(updated, changed);
    setNewSubtaskTitle("");
    setExpandedTaskId(taskId);
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    const updated = tasks.map((t) =>
      t.id === taskId
        ? {
            ...t,
            subtasks: (t.subtasks || []).map((s) =>
              s.id === subtaskId ? { ...s, completed: !s.completed } : s
            ),
          }
        : t
    );
    const changed = updated.find((t) => t.id === taskId)!;
    persistOne(updated, changed);
  };

  const deleteSubtask = (taskId: string, subtaskId: string) => {
    const updated = tasks.map((t) =>
      t.id === taskId
        ? { ...t, subtasks: (t.subtasks || []).filter((s) => s.id !== subtaskId) }
        : t
    );
    const changed = updated.find((t) => t.id === taskId)!;
    persistOne(updated, changed);
  };

  const startEditingSubtask = (sub: Subtask) => {
    setEditingSubtaskId(sub.id);
    setEditSubtaskTitle(sub.title);
  };

  const saveSubtaskEdit = (taskId: string, subtaskId: string) => {
    const title = editSubtaskTitle.trim().slice(0, MAX_TASK_TITLE);
    if (!title) { setEditingSubtaskId(null); return; }
    const updated = tasks.map((t) =>
      t.id === taskId
        ? {
            ...t,
            subtasks: (t.subtasks || []).map((s) =>
              s.id === subtaskId ? { ...s, title } : s
            ),
          }
        : t
    );
    const changed = updated.find((t) => t.id === taskId)!;
    persistOne(updated, changed);
    setEditingSubtaskId(null);
  };

  const setSubtaskDueDate = (taskId: string, subtaskId: string, date: string | undefined) => {
    const updated = tasks.map((t) =>
      t.id === taskId
        ? {
            ...t,
            subtasks: (t.subtasks || []).map((s) =>
              s.id === subtaskId ? { ...s, dueDate: date } : s
            ),
          }
        : t
    );
    const changed = updated.find((t) => t.id === taskId)!;
    persistOne(updated, changed);
  };

  const startEditingDesc = (task: Task) => {
    setEditingDescId(task.id);
    setEditDesc(task.description ?? "");
  };

  const saveDesc = (id: string) => {
    const desc = editDesc.trim();
    const updated = tasks.map((t) =>
      t.id === id ? { ...t, description: desc || undefined } : t
    );
    const changed = updated.find((t) => t.id === id)!;
    persistOne(updated, changed);
    setEditingDescId(null);
  };

  const moveTaskToProject = (taskId: string, newProjectId: string) => {
    const updated = tasks.map((t) =>
      t.id === taskId ? { ...t, projectId: newProjectId } : t
    );
    const changed = updated.find((t) => t.id === taskId)!;
    persistOne(updated, changed);
  };

  const handleBucketDrop = (draggedTaskId: string, target: BucketDropTarget) => {
    const updated = applyBucketDrop(tasks, draggedTaskId, target, activeTaskId);
    if (!updated) {
      showToast(
        "Drag within the same section to reorder, or drop on another project column to move.",
        "error"
      );
      return;
    }
    persist(updated);
  };

  const handleBucketMove = (taskId: string, direction: "up" | "down") => {
    const updated = moveBucketTaskInLane(tasks, taskId, direction, activeTaskId);
    if (updated) persist(updated);
  };

  const setTaskRecurrence = (taskId: string, recurrence: RecurrenceType | undefined) => {
    const updated = tasks.map((t) =>
      t.id === taskId ? { ...t, recurrence } : t
    );
    const changed = updated.find((t) => t.id === taskId)!;
    persistOne(updated, changed);
  };

  const setTaskPriority = (taskId: string, priority: TaskPriority | undefined) => {
    const updated = tasks.map((t) => (t.id === taskId ? { ...t, priority } : t));
    persist(updated);
  };

  const setTaskBlocked = (taskId: string, blocked: boolean) => {
    const updated = tasks.map((t) => {
      if (t.id !== taskId) return t;
      if (blocked) return { ...t, blocked: true, someday: false };
      return { ...t, blocked: false };
    });
    persist(updated);
    if (blocked) showToast("Marked as waiting");
  };

  const setTaskSomeday = (taskId: string, someday: boolean) => {
    const updated = tasks.map((t) => {
      if (t.id !== taskId) return t;
      if (someday) return { ...t, someday: true, blocked: false, dueDate: undefined };
      return { ...t, someday: false };
    });
    persist(updated);
    if (someday) showToast("Moved to Someday");
  };

  const taskDetailPanelProps = (task: Task) => ({
    isLinked: activeTaskId === task.id,
    activeTaskId,
    isTimerRunning,
    activeProjects: projects.filter((p) => !p.archived),
    editingDesc: editingDescId === task.id,
    editDesc,
    onEditDescChange: setEditDesc,
    onStartEditDesc: () => startEditingDesc(task),
    onSaveDesc: () => saveDesc(task.id),
    onCancelEditDesc: () => setEditingDescId(null),
    onSetDueDate: (date: string | undefined) => setDueDate(task.id, date),
    onSetPriority: (priority: TaskPriority | undefined) => setTaskPriority(task.id, priority),
    onSetBlocked: (blocked: boolean) => setTaskBlocked(task.id, blocked),
    onSetSomeday: (someday: boolean) => setTaskSomeday(task.id, someday),
    onSetRecurrence: (recurrence: RecurrenceType | undefined) => setTaskRecurrence(task.id, recurrence),
    onMoveToProject: (projectId: string) => moveTaskToProject(task.id, projectId),
    newSubtaskTitle,
    onNewSubtaskTitleChange: setNewSubtaskTitle,
    onAddSubtask: () => addSubtask(task.id),
    editingSubtaskId,
    editSubtaskTitle,
    onStartEditSubtask: startEditingSubtask,
    onEditSubtaskTitleChange: setEditSubtaskTitle,
    onSaveSubtaskEdit: (subId: string) => saveSubtaskEdit(task.id, subId),
    onCancelEditSubtask: () => setEditingSubtaskId(null),
    onToggleSubtask: (subId: string) => toggleSubtask(task.id, subId),
    onSetSubtaskDueDate: (subId: string, date: string | undefined) => setSubtaskDueDate(task.id, subId, date),
    onDeleteSubtask: (subId: string) => deleteSubtask(task.id, subId),
  });

  const toggleTaskDetail = (taskId: string) => {
    setExpandedTaskId((current) => {
      const next = current === taskId ? null : taskId;
      if (next !== current) setNewSubtaskTitle("");
      return next;
    });
  };

  const closeTaskDetail = () => {
    setExpandedTaskId(null);
    setNewSubtaskTitle("");
  };

  // Filter tasks for the selected project
  const isAllProjects = selectedProjectId === ALL_PROJECTS_ID;
  const activeProjects = projects.filter((p) => !p.archived);
  const archivedProjects = projects.filter((p) => p.archived);
  const sortedProjects = sortProjectsForDisplay(activeProjects);
  const pinnedProjectCount = sortedProjects.filter((p) => p.favorite).length;
  const isTodayFilter = selectedProjectId === TODAY_FILTER_ID;
  const isThisWeekFilter = selectedProjectId === THIS_WEEK_FILTER_ID;
  const isThisMonthFilter = selectedProjectId === THIS_MONTH_FILTER_ID;
  const isThisYearFilter = selectedProjectId === THIS_YEAR_FILTER_ID;
  const isTimeFilter = isTodayFilter || isThisWeekFilter || isThisMonthFilter || isThisYearFilter;
  const defaultNewTaskProjectId = useMemo(() => {
    if (isTimeFilter) {
      return projectFilterId !== ALL_PROJECTS_ID ? projectFilterId : DEFAULT_PROJECT_ID;
    }
    if (isAllProjects || selectedProjectId === ALL_PROJECTS_ID) {
      return DEFAULT_PROJECT_ID;
    }
    if (
      selectedProjectId === TODAY_FILTER_ID ||
      selectedProjectId === THIS_WEEK_FILTER_ID ||
      selectedProjectId === THIS_MONTH_FILTER_ID ||
      selectedProjectId === THIS_YEAR_FILTER_ID
    ) {
      return DEFAULT_PROJECT_ID;
    }
    return selectedProjectId;
  }, [isTimeFilter, projectFilterId, isAllProjects, selectedProjectId]);

  useEffect(() => {
    setNewTaskProjectId(defaultNewTaskProjectId);
  }, [defaultNewTaskProjectId]);

  const activeProjectTabId = isTimeFilter
    ? projectFilterId
    : isAllProjects
      ? null
      : selectedProjectId;
  const applyTemplate = useCallback(
    (tpl: (typeof TASK_TEMPLATES)[number]) => {
      const templateProjectId = isTimeFilter
        ? projectFilterId !== ALL_PROJECTS_ID
          ? projectFilterId
          : DEFAULT_PROJECT_ID
        : isAllProjects
          ? DEFAULT_PROJECT_ID
          : selectedProjectId;
      const newTasks = templateToTasks(tpl, templateProjectId);
      persist([...tasks, ...newTasks]);
    },
    [tasks, isAllProjects, isTimeFilter, projectFilterId, selectedProjectId, persist]
  );

  const today = getToday();
  const endOfWeek = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return formatDateLocal(d);
  })();
  const endOfMonth = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1, 0);
    return formatDateLocal(d);
  })();
  const endOfYear = `${new Date().getFullYear()}-12-31`;
  const todayTasks = tasks.filter((t) => !t.archivedAt && !t.completed && t.dueDate && (t.dueDate <= today));
  const todayOpenCount = todayTasks.length;
  const allOpenCount = tasks.filter((t) => !t.completed && !t.archivedAt).length;
  const overdueTasks = tasks.filter((t) => !t.archivedAt && !t.completed && isActionableOverdue(t));
  const thisWeekTasks = tasks.filter((t) => !t.archivedAt && !t.completed && t.dueDate && (t.dueDate <= endOfWeek));
  const thisMonthTasks = tasks.filter((t) => !t.archivedAt && !t.completed && t.dueDate && (t.dueDate <= endOfMonth));
  const thisYearTasks = tasks.filter((t) => !t.archivedAt && !t.completed && t.dueDate && (t.dueDate <= endOfYear));
  const undatedOpenTasks = tasks.filter((t) => !t.archivedAt && !t.completed && !t.dueDate && !t.someday);
  const somedayOpenTasks = tasks.filter((t) => !t.archivedAt && !t.completed && t.someday);
  const timeScopedDatedTasks = isTodayFilter
    ? todayTasks
    : isThisWeekFilter
      ? thisWeekTasks
      : isThisMonthFilter
        ? thisMonthTasks
        : isThisYearFilter
          ? thisYearTasks
          : [];
  const timeScopedTasks = isTimeFilter
    ? [...timeScopedDatedTasks, ...undatedOpenTasks, ...somedayOpenTasks]
    : isAllProjects
      ? tasks.filter((t) => !t.archivedAt)
      : tasks.filter((t) => t.projectId === selectedProjectId && !t.archivedAt);
  const projectTasks =
    isTimeFilter && projectFilterId !== ALL_PROJECTS_ID
      ? timeScopedTasks.filter((t) => t.projectId === projectFilterId)
      : timeScopedTasks;
  const isAllProjectsScopeActive = isTimeFilter
    ? projectFilterId === ALL_PROJECTS_ID
    : isAllProjects;

  useLayoutEffect(() => {
    const container = projectTabsContainerRef.current;
    const measure = projectTabMeasureRef.current;
    const allTab = allProjectsTabRef.current;
    const toolbar = projectTabsToolbarRef.current;
    if (!container || !measure || !allTab || !toolbar) return;

    const compute = () => {
      const available = container.clientWidth;
      const tabEls = Array.from(measure.querySelectorAll<HTMLElement>("[data-measure-tab]"));
      const moreEl = measure.querySelector<HTMLElement>("[data-measure-more]");
      const moreWidth = moreEl?.offsetWidth ?? 96;
      const gap = 8;

      let used = allTab.offsetWidth + toolbar.offsetWidth + gap * 2;
      let count = 0;

      for (let i = 0; i < tabEls.length; i++) {
        const tabWidth = tabEls[i].offsetWidth + gap;
        const hiddenAfterThis = tabEls.length - i - 1;
        const reserve = hiddenAfterThis > 0 ? moreWidth + gap : 0;
        if (used + tabWidth + reserve > available) break;
        used += tabWidth;
        count++;
      }

      setMaxVisibleProjectTabs(Math.max(1, count));
    };

    compute();
    const observer = new ResizeObserver(compute);
    observer.observe(container);
    return () => observer.disconnect();
  }, [projects, tasks, isTimeFilter]);

  const visibleProjectTabs = (() => {
    const tabs = sortedProjects.slice(0, maxVisibleProjectTabs);
    if (!activeProjectTabId || activeProjectTabId === ALL_PROJECTS_ID) return tabs;
    if (!sortedProjects.some((p) => p.id === activeProjectTabId)) return tabs;
    if (tabs.some((p) => p.id === activeProjectTabId)) return tabs;
    return [
      ...tabs.slice(0, Math.max(0, maxVisibleProjectTabs - 1)),
      sortedProjects.find((p) => p.id === activeProjectTabId)!,
    ];
  })();
  const visibleProjectTabIds = new Set(visibleProjectTabs.map((p) => p.id));
  const overflowProjectTabs = sortedProjects.filter((p) => !visibleProjectTabIds.has(p.id));

  const pendingTasks = projectTasks
    .filter((t) => !t.completed)
    .sort((a, b) => {
      const secA = getTaskListSectionOrder(getTaskListSection(a));
      const secB = getTaskListSectionOrder(getTaskListSection(b));
      if (secA !== secB) return secA - secB;

      // Pin the active task to the top
      if (a.id === activeTaskId && b.id !== activeTaskId) return -1;
      if (b.id === activeTaskId && a.id !== activeTaskId) return 1;
      
      // Overdue tasks come first (before today) — within overdue section only
      const aOverdue = isActionableOverdue(a);
      const bOverdue = isActionableOverdue(b);
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;

      // Overdue: priority first (high → low), then oldest due date
      if (aOverdue && bOverdue) {
        if (a.priority != null && b.priority == null) return -1;
        if (a.priority == null && b.priority != null) return 1;
        if (a.priority != null && b.priority != null && a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) {
          return a.dueDate < b.dueDate ? -1 : 1;
        }
      }

      // Non-overdue: priority, then due date
      if (a.priority != null && b.priority == null) return -1;
      if (a.priority == null && b.priority != null) return 1;
      if (a.priority != null && b.priority != null && a.priority !== b.priority) {
        return a.priority - b.priority;
      }

      // Tasks with due dates come next, sorted by due date ascending
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;
      if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) return a.dueDate < b.dueDate ? -1 : 1;
      
      // Within same due date/priority, respect manual order
      if (a.order != null && b.order != null) return a.order - b.order;
      if (a.order != null) return -1;
      if (b.order != null) return 1;
      // Otherwise newest first by created date
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  const scopedDatedOpenCount = isTimeFilter
    ? projectTasks.filter((t) => !t.completed && t.dueDate).length
    : 0;
  const scopedUndatedOpenCount = isTimeFilter
    ? projectTasks.filter((t) => !t.completed && getTaskListSection(t) === "inbox").length
    : 0;
  const scopedSomedayOpenCount = projectTasks.filter((t) => !t.completed && t.someday).length;
  const timeScopeDescription = isTodayFilter
    ? "Due today or earlier"
    : isThisWeekFilter
      ? "Due this week or earlier"
      : isThisMonthFilter
        ? "Due this month or earlier"
        : isThisYearFilter
          ? "Due this year or earlier"
          : null;
  const bucketDatedLaneLabel = isTodayFilter
    ? "Due today"
    : isThisWeekFilter
      ? "Due this week"
      : isThisMonthFilter
        ? "Due this month"
        : isThisYearFilter
          ? "Due this year"
          : "Scheduled";
  const bucketScopedTasks = (() => {
    if (isTimeFilter) {
      const dated = timeScopedDatedTasks;
      return projectFilterId !== ALL_PROJECTS_ID
        ? dated.filter((t) => t.projectId === projectFilterId)
        : dated;
    }
    return tasks.filter((t) => !t.archivedAt);
  })();
  const bucketOpenTasks = bucketScopedTasks.filter((t) => !t.completed && !t.archivedAt);
  const bucketDatedCount = bucketOpenTasks.filter((t) => t.dueDate).length;
  const bucketUndatedCount = bucketOpenTasks.filter((t) => !t.dueDate).length;
  const bucketTasksByProject = new Map<string, Task[]>();
  const bucketCompletedCountByProject = new Map<string, number>();
  for (const project of sortedProjects) {
    bucketTasksByProject.set(
      project.id,
      bucketOpenTasks.filter((t) => t.projectId === project.id)
    );
    bucketCompletedCountByProject.set(
      project.id,
      tasks.filter((t) => !t.archivedAt && t.completed && t.projectId === project.id).length
    );
  }
  const completedTasks = projectTasks.filter((t) => t.completed);
  const archivedTasks = isAllProjects
    ? tasks.filter((t) => t.archivedAt)
    : tasks.filter((t) => t.projectId === selectedProjectId && t.archivedAt);
  const currentProject = projects.find((p) => p.id === selectedProjectId);
  const getProjectName = (projectId: string) =>
    projects.find((p) => p.id === projectId)?.name ?? "General";

  const isFocusMode = !!focusProjectId;
  const focusProject = focusProjectId ? projects.find((p) => p.id === focusProjectId) : null;

  const taskSubtaskSectionProps = (task: Task) => ({
    task,
    newSubtaskTitle,
    onNewSubtaskTitleChange: setNewSubtaskTitle,
    onAddSubtask: () => addSubtask(task.id),
    editingSubtaskId,
    editSubtaskTitle,
    onStartEditSubtask: startEditingSubtask,
    onEditSubtaskTitleChange: setEditSubtaskTitle,
    onSaveSubtaskEdit: (subId: string) => saveSubtaskEdit(task.id, subId),
    onCancelEditSubtask: () => setEditingSubtaskId(null),
    onToggleSubtask: (subId: string) => toggleSubtask(task.id, subId),
    onSetSubtaskDueDate: (subId: string, date: string | undefined) =>
      setSubtaskDueDate(task.id, subId, date),
    onDeleteSubtask: (subId: string) => deleteSubtask(task.id, subId),
  });

  const renderTaskExpansionContent = (task: Task, compact = false) => {
    const subtasks = task.subtasks || [];
    const hasSubtasks = subtasks.length > 0;

    return (
      <>
        <TaskSubtaskSection
          {...taskSubtaskSectionProps(task)}
          showAddForm={hasSubtasks || compact}
          compact={compact}
        />
        <TaskDetailPanel
          task={task}
          variant="inline"
          hideSubtasks
          {...taskDetailPanelProps(task)}
          onDeleteTask={() => {
            deleteTask(task.id);
            closeTaskDetail();
          }}
          onStartTask={() => onStartTask(task.id)}
          onDeselectTask={() => onSelectTask(null)}
        />
      </>
    );
  };

  const renderTaskInlineExpansion = (task: Task, compact = false) => {
    if (compact) return null;

    const subtasks = task.subtasks || [];
    const hasSubtasks = subtasks.length > 0;
    const isExpanded = expandedTaskId === task.id;
    const collapseSubtasksInGrid = viewMode === "list";

    if (collapseSubtasksInGrid) {
      if (!isExpanded) return null;
    } else if (!hasSubtasks && !isExpanded) {
      return null;
    }

    return (
      <div className="overflow-hidden">
        <TaskSubtaskSection
          {...taskSubtaskSectionProps(task)}
          showAddForm={isExpanded || (hasSubtasks && !collapseSubtasksInGrid)}
          compact={compact}
        />
        {isExpanded && (
          <TaskDetailPanel
            task={task}
            variant="inline"
            hideSubtasks
            {...taskDetailPanelProps(task)}
            onDeleteTask={() => {
              deleteTask(task.id);
              closeTaskDetail();
            }}
            onStartTask={() => onStartTask(task.id)}
            onDeselectTask={() => onSelectTask(null)}
          />
        )}
      </div>
    );
  };

  const renderOpenTasks = (taskList: Task[], options?: { className?: string }) => (
    <OpenTaskList
      tasks={taskList}
      activeTaskId={activeTaskId}
      isTimerRunning={isTimerRunning}
      expandedTaskId={expandedTaskId}
      editingId={editingId}
      editTitle={editTitle}
      dragTaskId={dragTaskId}
      dragOverTaskId={dragOverTaskId}
      onToggleComplete={toggleComplete}
      onSaveEdit={saveEdit}
      onStartEdit={startEditing}
      onEditTitleChange={setEditTitle}
      onCancelEdit={() => setEditingId(null)}
      onToggleTaskDetail={toggleTaskDetail}
      onStartTask={onStartTask}
      onSelectTask={onSelectTask}
      onDeleteTask={deleteTask}
      onSetDueDate={setDueDate}
      onSnoozeToToday={snoozeToToday}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      renderBelowTask={renderTaskInlineExpansion}
      {...createTaskListDnD(taskList)}
      className={options?.className ?? "space-y-2"}
    />
  );

  return (
    <div className="app-surface rounded-2xl dark:bg-[#111827] dark:border-[#1e3050] overflow-hidden min-w-0">

      {/* Focus mode header */}
      {isFocusMode ? (
        <div
          className="panel-header-calm px-3 sm:px-4 py-2 text-slate-700 dark:text-white rounded-t-2xl"
        >
          <div className="flex items-center justify-between min-w-0">
            <div className="flex items-center gap-2.5 min-w-0">
              {focusProject?.color && (
                <span className="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-slate-300 dark:ring-white/20" style={{ backgroundColor: focusProject.color }} />
              )}
              <div className="min-w-0">
                <p className="app-section-label text-slate-400 dark:text-white/50 leading-none mb-0.5">Project Focus</p>
                <h2 className="text-base sm:text-lg font-bold truncate">{focusProject?.name ?? "Project"}</h2>
              </div>
            </div>
            <button
              onClick={() => onFocusProject?.(null)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg bg-slate-200/60 dark:bg-white/10 text-slate-500 dark:text-white/80 hover:bg-slate-300/60 dark:hover:bg-white/20 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Exit Focus
            </button>
          </div>
        </div>
      ) : (
      <>
      {/* Header */}
      <div
        className="panel-header-calm px-3 sm:px-4 py-2 text-slate-700 dark:text-white rounded-t-2xl"
      >
        <div className="flex items-center justify-between min-w-0 gap-2">
          <div className="min-w-0 flex-shrink">
            {projectManageOpen ? (
              <>
                <button
                  type="button"
                  onClick={closeProjectManage}
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 mb-1.5 transition-colors touch-target-sm -ml-2 px-2 py-1.5 rounded-lg"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to tasks
                </button>
                <h2 className="text-base sm:text-lg font-semibold">Projects</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-normal normal-case tracking-normal mt-0.5">
                  {sortedProjects.length} project{sortedProjects.length === 1 ? "" : "s"}
                  {pinnedProjectCount > 0 && (
                    <span className="text-amber-600 dark:text-amber-300">
                      {" "}
                      · {pinnedProjectCount} pinned
                    </span>
                  )}
                  {" "}— tap ★ to pin · ⋯ to rename, archive, or delete
                </p>
              </>
            ) : (
              <>
            {cameFromBucket && viewMode === "list" && (
              <button
                type="button"
                onClick={backToBuckets}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 mb-1.5 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Buckets
              </button>
            )}
            <h2 className="text-base font-semibold flex items-center gap-1.5 flex-wrap">
              <svg
                className="w-4 h-4 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <span>
                Tasks
                {viewMode === "plan" && (
                  <span className="text-sm font-medium text-indigo-600 dark:text-indigo-300 normal-case tracking-normal">
                    {" "}· AI plan
                  </span>
                )}
              </span>
              {!focusMode && viewMode === "list" && isAllProjects && !isTimeFilter && (
                <button
                  type="button"
                  onClick={() => selectProject(TODAY_FILTER_ID)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 border border-orange-200/80 dark:border-orange-800/50 bg-white dark:bg-[#131d30] text-orange-700 dark:text-orange-300 hover:bg-orange-50/80 dark:hover:bg-orange-900/20 transition-colors shadow-sm"
                >
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="leading-none">Due today</span>
                  {todayOpenCount > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-orange-500 text-white text-xs font-bold tabular-nums leading-none">
                      {todayOpenCount}
                    </span>
                  )}
                </button>
              )}
            </h2>
            {!focusMode && (viewMode === "list" || viewMode === "bucket" || viewMode === "card") && (
              <p className="text-xs text-slate-600 dark:text-slate-300 font-normal normal-case tracking-normal mt-0 pl-7 leading-snug hidden lg:block line-clamp-1">
                {viewMode === "card"
                  ? sortedProjects.length >= 2
                    ? "Top priorities per project · drag ⋮⋮ to reorder"
                    : "Top priorities per project at a glance"
                  : viewMode === "bucket"
                  ? isTimeFilter
                    ? [
                        timeScopeDescription,
                        `${bucketDatedCount} due`,
                        bucketUndatedCount > 0 ? `${bucketUndatedCount} no date` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")
                    : "All projects side by side"
                  : isTimeFilter
                    ? `${timeScopeDescription ?? "Scheduled tasks"} · tasks without a due date appear below`
                    : "Pick a task, then hit Focus to start your session"}
              </p>
            )}
            {!focusMode && viewMode === "card" && (
              <p className="text-xs text-slate-600 dark:text-slate-300 font-normal normal-case tracking-normal mt-0.5 pl-7 sm:hidden">
                {sortedProjects.length >= 2
                  ? "Top tasks per project · use ▲▼ to reorder · ⋯ to manage"
                  : "Top tasks per project · ⋯ to manage projects"}
              </p>
            )}
              </>
            )}
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 min-w-0">
            {/* Time filters - hidden on mobile, shown inline on sm+ */}
            {!focusMode && !projectManageOpen && (
            <div className="app-seg-track hidden sm:flex items-center gap-0.5" data-tour="time-filters">
              <button
                onClick={() => selectProject(ALL_PROJECTS_ID)}
                className={`px-2 py-1 rounded-md text-sm font-medium transition-colors ${isAllProjects && !isTimeFilter ? FILTER_TAB_ACTIVE : FILTER_TAB_INACTIVE}`}
                title="All open tasks — every project"
                aria-label="All tasks"
              >
                All
              </button>
              <button
                onClick={() => selectProject(TODAY_FILTER_ID)}
                className={`px-2 py-1 rounded-md text-sm font-medium transition-colors relative ${isTodayFilter ? FILTER_TAB_ACTIVE : FILTER_TAB_INACTIVE}`}
                title={overdueTasks.length > 0 ? `${overdueTasks.length} overdue task${overdueTasks.length === 1 ? '' : 's'}` : "Tasks with a due date of today or earlier"}
                aria-label="Due today or earlier"
              >
                Today
                {overdueTasks.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 text-xs app-badge font-bold rounded-full bg-red-500 text-white border border-white dark:border-[#111827]">
                    {overdueTasks.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => selectProject(THIS_WEEK_FILTER_ID)}
                className={`px-2 py-1 rounded-md text-sm font-medium transition-colors ${isThisWeekFilter ? FILTER_TAB_ACTIVE : FILTER_TAB_INACTIVE}`}
                title="Tasks with a due date this week or earlier"
                aria-label="Due this week or earlier"
              >
                Week
              </button>
              <button
                onClick={() => selectProject(THIS_MONTH_FILTER_ID)}
                className={`px-2 py-1 rounded-md text-sm font-medium transition-colors ${isThisMonthFilter ? FILTER_TAB_ACTIVE : FILTER_TAB_INACTIVE}`}
                title="Tasks with a due date this month or earlier"
                aria-label="Due this month or earlier"
              >
                Month
              </button>
              <button
                onClick={() => selectProject(THIS_YEAR_FILTER_ID)}
                className={`px-2 py-1 rounded-md text-sm font-medium transition-colors ${isThisYearFilter ? FILTER_TAB_ACTIVE : FILTER_TAB_INACTIVE}`}
                title="Tasks with a due date this year or earlier"
                aria-label="Due this year or earlier"
              >
                Year
              </button>
            </div>
            )}
            {/* View mode — mobile dropdown */}
            {!projectManageOpen && (
            <label className="sm:hidden flex items-center gap-1.5 min-w-0">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 shrink-0">View</span>
              <select
                value={viewMode}
                onChange={(e) => selectViewMode(e.target.value as TaskViewMode)}
                className="flex-1 min-w-0 text-sm font-medium rounded-lg border border-slate-200 dark:border-[#243350] bg-white dark:bg-[#131d30] text-slate-700 dark:text-slate-200 px-2 py-2 touch-target-sm"
                aria-label="Task view mode"
                data-tour="view-modes"
              >
                <option value="bucket">Buckets</option>
                <option value="card">Cards</option>
                <option value="list">List</option>
                <option value="calendar">Calendar</option>
                <option value="plan">Smart Plan</option>
              </select>
            </label>
            )}
            {/* View mode toggles — desktop */}
            {!projectManageOpen && (
            <div className="hidden sm:flex items-center gap-1.5 shrink-0" data-tour="view-modes">
              <span className="hidden md:inline text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 shrink-0">
                View
              </span>
              <div className="app-seg-track app-view-track flex items-center gap-0.5">
              <button
                onClick={() => selectViewMode("bucket")}
                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${viewMode === "bucket" ? VIEW_TAB_ACTIVE : VIEW_TAB_INACTIVE}`}
                title="Bucket view — all projects"
                aria-label="Bucket view"
              >
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v18M5 3h4a1 1 0 011 1v16a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1zm10 0h4a1 1 0 011 1v16a1 1 0 01-1 1h-4a1 1 0 01-1-1V4a1 1 0 011-1z" />
                </svg>
                <span>Buckets</span>
              </button>
              <button
                onClick={() => selectViewMode("card")}
                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${viewMode === "card" ? VIEW_TAB_ACTIVE : VIEW_TAB_INACTIVE}`}
                title="Card view — top tasks per project"
                aria-label="Card view"
              >
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
                <span>Cards</span>
              </button>
              <button
                onClick={() => selectViewMode("list")}
                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${viewMode === "list" ? VIEW_TAB_ACTIVE : VIEW_TAB_INACTIVE}`}
                title="List view"
                aria-label="List view"
              >
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span>List</span>
              </button>
              <button
                onClick={() => selectViewMode("calendar")}
                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${viewMode === "calendar" ? VIEW_TAB_ACTIVE : VIEW_TAB_INACTIVE}`}
                title="Calendar view"
                aria-label="Calendar view"
              >
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Cal</span>
              </button>
              </div>
            </div>
            )}
            {onOpenSettings && (
              <TaskPanelMenu
                user={user}
                onOpenSettings={onOpenSettings}
                onToggleFullscreen={onToggleFullscreen}
                isFullscreen={isFullscreen}
                templates={TASK_TEMPLATES}
                onSelectTemplate={applyTemplate}
                onTogglePlan={() => {
                  if (viewMode === "plan") {
                    selectViewMode(viewBeforePlanRef.current);
                  } else {
                    viewBeforePlanRef.current =
                      viewMode === "calendar" || viewMode === "list" || viewMode === "bucket" || viewMode === "card"
                        ? viewMode
                        : "card";
                    setViewMode("plan");
                  }
                  loadSettings().then(setPlanSettings);
                }}
                isPlanView={viewMode === "plan"}
              />
            )}
            {/* Fullscreen toggle */}
            {onToggleFullscreen && (
              <button
                onClick={onToggleFullscreen}
                className={`p-2 rounded-lg transition-colors ${isFullscreen ? "bg-slate-300/70 dark:bg-white/20 text-slate-800 dark:text-white" : "text-slate-400 dark:text-white/50 hover:text-slate-600 dark:hover:text-white/80 hover:bg-slate-200/60 dark:hover:bg-white/10"}`}
                title={isFullscreen ? "Exit fullscreen" : "Fullscreen tasks"}
                aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen tasks"}
              >
                {isFullscreen ? (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9L4 4m0 0h4M4 4v4m11-1V3m0 0h-4m4 0v4M4 15v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Time filters - mobile: own row below title */}
        {!focusMode && !projectManageOpen && (
        <div className="app-seg-track flex sm:hidden items-center gap-1 mt-3" data-tour="time-filters">
          <button
            onClick={() => selectProject(ALL_PROJECTS_ID)}
            className={`flex-1 px-1.5 py-1.5 rounded-md text-sm font-medium transition-colors text-center ${isAllProjects && !isTimeFilter ? FILTER_TAB_ACTIVE : FILTER_TAB_INACTIVE}`}
            title="All open tasks"
            aria-label="All tasks"
          >
            All
          </button>
          <button
            onClick={() => selectProject(TODAY_FILTER_ID)}
            className={`flex-1 px-1.5 py-1.5 rounded-md text-sm font-medium transition-colors text-center relative ${isTodayFilter ? FILTER_TAB_ACTIVE : FILTER_TAB_INACTIVE}`}
            title={overdueTasks.length > 0 ? `${overdueTasks.length} overdue task${overdueTasks.length === 1 ? '' : 's'}` : "Tasks with a due date of today or earlier"}
            aria-label="Due today or earlier"
          >
            Today
            {overdueTasks.length > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 text-xs app-badge font-bold rounded-full bg-red-500 text-white border border-white dark:border-[#111827]">
                {overdueTasks.length}
              </span>
            )}
          </button>
          <button
            onClick={() => selectProject(THIS_WEEK_FILTER_ID)}
            className={`flex-1 px-1.5 py-1.5 rounded-md text-sm font-medium transition-colors text-center ${isThisWeekFilter ? FILTER_TAB_ACTIVE : FILTER_TAB_INACTIVE}`}
            title="Tasks with a due date this week or earlier"
            aria-label="Due this week or earlier"
          >
            Week
          </button>
          <button
            onClick={() => selectProject(THIS_MONTH_FILTER_ID)}
            className={`flex-1 px-1.5 py-1.5 rounded-md text-sm font-medium transition-colors text-center ${isThisMonthFilter ? FILTER_TAB_ACTIVE : FILTER_TAB_INACTIVE}`}
            title="Tasks with a due date this month or earlier"
            aria-label="Due this month or earlier"
          >
            Month
          </button>
          <button
            onClick={() => selectProject(THIS_YEAR_FILTER_ID)}
            className={`flex-1 px-1.5 py-1.5 rounded-md text-sm font-medium transition-colors text-center ${isThisYearFilter ? FILTER_TAB_ACTIVE : FILTER_TAB_INACTIVE}`}
            title="Tasks with a due date this year or earlier"
            aria-label="Due this year or earlier"
          >
            Year
          </button>
        </div>
        )}
      </div>
      </>
      )}

      {!isFocusMode && projectManageOpen && (
        <ProjectManageView
          sortedProjects={sortedProjects}
          archivedProjects={archivedProjects}
          sharedProjects={sharedProjects}
          tasks={tasks}
          user={user}
          editingProjectId={editingProjectId}
          editProjectName={editProjectName}
          setEditProjectName={setEditProjectName}
          newProjectName={newProjectName}
          setNewProjectName={setNewProjectName}
          activeTaskId={activeTaskId}
          isTimerRunning={isTimerRunning}
          onToggleFavorite={toggleProjectFavorite}
          dragProjectId={dragProjectId}
          dragOverProjectId={dragOverProjectId}
          onProjectDragStart={handleProjectDragStart}
          onProjectDragOver={handleProjectDragOver}
          onProjectDrop={handleProjectDrop}
          onProjectDragEnd={handleProjectDragEnd}
          onMoveProject={handleMoveProject}
          onOpenProject={(id) => {
            closeProjectManage();
            selectViewMode(viewBeforeManageRef.current);
            selectProjectScope(id);
          }}
          onUpdateColor={updateProjectColor}
          onUpdateDueDate={updateProjectDueDate}
          onStartRename={startEditingProject}
          onSaveRename={saveProjectEdit}
          onCancelRename={() => setEditingProjectId(null)}
          onShare={setShareModalProject}
          onArchive={toggleProjectArchived}
          onDelete={deleteProject}
          onUnarchive={toggleProjectArchived}
          onFocusProject={(id) => {
            onFocusProject?.(id);
            closeProjectManage();
          }}
          onSelectSharedProject={(sp) => {
            closeProjectManage();
            selectViewMode(viewBeforeManageRef.current);
            selectSharedProject(sp);
          }}
          onLeaveShared={handleLeaveSharedProject}
          onAddProject={addProject}
          renderOpenTasks={renderOpenTasks}
        />
      )}

      {/* Smart Plan view */}
      {!isFocusMode && !projectManageOpen && viewMode === "plan" && (
        <SmartPlan
          tasks={tasks}
          projects={projects}
          settings={planSettings}
          onStartTask={onStartTask}
        />
      )}

      {/* Calendar view */}
      {!isFocusMode && !projectManageOpen && viewMode === "calendar" && (
        <TaskCalendarView
          tasks={tasks}
          projects={projects}
          calendarDate={calendarDate}
          setCalendarDate={setCalendarDate}
          onSetDueDate={setDueDate}
          activeTaskId={activeTaskId}
          onStartTask={onStartTask}
          isTimerRunning={isTimerRunning}
          selectedDay={calendarSelectedDay}
          onSelectDay={setCalendarSelectedDay}
          onQuickAdd={(title, dueDate) => addTaskWithTitle(title, dueDate)}
          expandedTaskId={expandedTaskId}
          onToggleTaskDetail={toggleTaskDetail}
          renderBelowTask={renderTaskInlineExpansion}
        />
      )}

      {/* Time scope meta — list view only (bucket uses header subtitle) */}
      {!isFocusMode && !projectManageOpen && viewMode === "list" && isTimeFilter && (() => {
        const activeProject = projects.find((p) => p.id === projectFilterId);
        return (
          <p className="app-inline-meta px-3 sm:px-4 pt-1.5 pb-0 text-sm app-text-meta text-slate-600 dark:text-slate-400">
            <span className="font-medium text-slate-700 dark:text-slate-200">{timeScopeDescription}</span>
            {projectFilterId !== ALL_PROJECTS_ID && activeProject && (
              <span className="font-medium text-slate-700 dark:text-slate-200">{activeProject.name}</span>
            )}
            <span>{scopedDatedOpenCount} due</span>
            {scopedUndatedOpenCount > 0 && (
              <span>{scopedUndatedOpenCount} no date</span>
            )}
            {overdueTasks.length > 0 && (
              <span className="text-red-600 dark:text-red-400">{overdueTasks.length} overdue</span>
            )}
          </p>
        );
      })()}

      {/* Bucket toolbar — projects only (counts live in header subtitle) */}
      {!isFocusMode && !projectManageOpen && viewMode === "bucket" && (
        <div className="px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-slate-200/90 dark:border-[#243350]/80 bg-slate-50/60 dark:bg-[#0d1526]/50">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0">
            <button
              type="button"
              onClick={openProjectManage}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100/90 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors touch-target-sm"
              data-tour="manage-projects"
            >
              <svg className="w-4 h-4 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m0 4v2m0-2a2 2 0 100 4m0-4a2 2 0 110 4m0 4v2m0-2a2 2 0 100 4m0-4a2 2 0 110 4" />
              </svg>
              Manage projects
            </button>
            <span className="hidden lg:inline app-text-meta text-slate-400 dark:text-slate-500">
              Drag to reorder · pin columns · scroll for more
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {sortedProjects.length > 1 && (
              <>
                <label htmlFor="bucket-project-jump" className="sr-only">
                  Go to project
                </label>
                <select
                  id="bucket-project-jump"
                  value={bucketJumpProjectId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setBucketJumpProjectId(id);
                    if (id) setBucketScrollToken((n) => n + 1);
                  }}
                  className="max-w-[11rem] sm:max-w-[14rem] px-3 py-1.5 text-sm font-medium rounded-lg bg-white dark:bg-[#131d30] text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-[#243350] outline-none focus:border-cyan-400 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%236b7280%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.23%207.21a.75.75%200%20011.06.02L10%2011.168l3.71-3.938a.75.75%200%20111.08%201.04l-4.25%204.5a.75.75%200%2001-1.08%200l-4.25-4.5a.75.75%200%2001.02-1.06z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.5rem_center] bg-no-repeat pr-8 truncate"
                  title="Jump to a project column"
                >
                  <option value="">Go to project…</option>
                  {sortedProjects.map((p) => {
                    const count = bucketTasksByProject.get(p.id)?.length ?? 0;
                    return (
                      <option key={p.id} value={p.id} title={projectTabTooltip(p)}>
                        {projectTabLabel(p)} ({count})
                      </option>
                    );
                  })}
                </select>
              </>
            )}
            <button
              type="button"
              onClick={() => { setNewProjectName(""); openProjectManage(); }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-cyan-700 dark:text-cyan-200 rounded-lg border border-cyan-200/90 dark:border-cyan-700/60 bg-cyan-50/90 dark:bg-cyan-950/40 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 shadow-sm transition-colors shrink-0"
              title="Create a new project bucket"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New project
            </button>
          </div>
        </div>
      )}

      {/* Bucket view — all projects as columns */}
      {!isFocusMode && !projectManageOpen && viewMode === "bucket" && !tasksReady && (
        <div className="px-3 sm:px-4 pb-4 pt-1 flex gap-3 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex-[0_0_calc((100%-1.5rem)/3)] min-w-0 rounded-xl border border-slate-200 dark:border-[#243350] p-3 space-y-2 animate-pulse"
            >
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
              <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-lg" />
              <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-lg" />
            </div>
          ))}
        </div>
      )}
      {!isFocusMode && !projectManageOpen && viewMode === "bucket" && tasksReady && (
        <TaskBucketView
          projects={sortedProjects}
          tasksByProject={bucketTasksByProject}
          completedCountByProject={bucketCompletedCountByProject}
          activeTaskId={activeTaskId}
          isTimerRunning={isTimerRunning}
          datedLaneLabel={bucketDatedLaneLabel}
          onToggleComplete={toggleComplete}
          onStartTask={onStartTask}
          onSelectTask={onSelectTask}
          onQuickAdd={(title, projectId) => addTaskWithTitle(title, undefined, projectId)}
          onToggleProjectFavorite={toggleProjectFavorite}
          onExpandProject={expandProjectFromBucket}
          editingTaskId={editingId}
          editTitle={editTitle}
          onStartEdit={startEditing}
          onEditTitleChange={setEditTitle}
          onSaveEdit={saveEdit}
          onCancelEdit={() => setEditingId(null)}
          onSetDueDate={setDueDate}
          expandedTaskId={expandedTaskId}
          onToggleTaskDetail={toggleTaskDetail}
          onBucketDrop={handleBucketDrop}
          onBucketMove={handleBucketMove}
          scrollToProjectId={bucketJumpProjectId || null}
          scrollToProjectToken={bucketScrollToken}
          renderBelowTask={renderTaskInlineExpansion}
        />
      )}

      {/* Card toolbar — manage projects on mobile */}
      {!isFocusMode && !projectManageOpen && viewMode === "card" && tasksReady && (
        <div className="sm:hidden px-3 py-2 flex items-center border-t border-slate-200/90 dark:border-[#243350]/80 bg-slate-50/60 dark:bg-[#0d1526]/50">
          <button
            type="button"
            onClick={openProjectManage}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100/90 dark:hover:bg-white/5 touch-target-sm"
            data-tour="manage-projects"
          >
            <svg className="w-4 h-4 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m0 4v2m0-2a2 2 0 100 4m0-4a2 2 0 110 4m0 4v2m0-2a2 2 0 100 4m0-4a2 2 0 110 4" />
            </svg>
            Manage projects
          </button>
        </div>
      )}

      {!isFocusMode && !projectManageOpen && viewMode === "card" && !tasksReady && (
        <div className="px-3 sm:px-4 pb-4 pt-1 grid grid-cols-1 min-[480px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-lg border border-slate-200 dark:border-[#243350] p-2.5 space-y-1.5 animate-pulse min-h-[7.5rem]"
            >
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-full" />
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-full" />
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-4/5" />
            </div>
          ))}
        </div>
      )}
      {!isFocusMode && !projectManageOpen && viewMode === "card" && tasksReady && (
        <TaskCardView
          projects={sortedProjects}
          tasksByProject={bucketTasksByProject}
          completedCountByProject={bucketCompletedCountByProject}
          activeTaskId={activeTaskId}
          isTimerRunning={isTimerRunning}
          dragProjectId={dragProjectId}
          dragOverProjectId={dragOverProjectId}
          onProjectDragStart={handleProjectDragStart}
          onProjectDragOver={handleProjectDragOver}
          onProjectDrop={handleProjectDrop}
          onProjectDragEnd={handleProjectDragEnd}
          dragTaskId={dragTaskId}
          dragOverTaskId={dragOverTaskId}
          onTaskDragStart={handleDragStart}
          onTaskDragOver={handleDragOver}
          onTaskDrop={handleCardTaskDrop}
          onTaskDragEnd={handleDragEnd}
          editingTaskId={editingId}
          editTitle={editTitle}
          onStartEdit={startEditing}
          onEditTitleChange={setEditTitle}
          onSaveEdit={saveEdit}
          onCancelEdit={() => setEditingId(null)}
          onDeleteTask={deleteTask}
          onMoveProject={handleMoveProject}
          onMoveTask={handleCardTaskMove}
          onExpandProject={expandProjectFromBucket}
          onQuickAdd={(title, projectId) => addTaskWithTitle(title, undefined, projectId)}
        />
      )}

      {/* Project filter — works with Today/Week/Month/Year via projectFilterId */}
      {!isFocusMode && !projectManageOpen && viewMode === "list" && (<>
      <div className="px-3 sm:px-4 pt-1 pb-1.5 relative border-b border-slate-200/90 dark:border-[#243350]/80" ref={projectMenuRef}>
        {/* Mobile: project dropdown (time scope is in the Tasks header) */}
        <div className="flex sm:hidden items-center gap-1.5">
          <select
            value={isTimeFilter ? projectFilterId : selectedProjectId}
            onChange={(e) => selectProjectScope(e.target.value)}
            className="flex-1 px-3 py-2 text-sm font-medium rounded-lg bg-slate-100 dark:bg-[#131d30] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#243350] outline-none focus:border-cyan-400 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%236b7280%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.23%207.21a.75.75%200%20011.06.02L10%2011.168l3.71-3.938a.75.75%200%20111.08%201.04l-4.25%204.5a.75.75%200%2001-1.08%200l-4.25-4.5a.75.75%200%2001.02-1.06z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.5rem_center] bg-no-repeat pr-8"
          >
            <option value={ALL_PROJECTS_ID}>
              All projects ({isTimeFilter ? timeScopedTasks.filter((t) => !t.completed).length : tasks.filter((t) => !t.completed && !t.archivedAt).length})
            </option>
            {sortedProjects.map((p) => {
              const count = isTimeFilter
                ? timeScopedTasks.filter((t) => t.projectId === p.id && !t.completed).length
                : tasks.filter((t) => t.projectId === p.id && !t.completed).length;
              return (
              <option key={p.id} value={p.id} title={projectTabTooltip(p)}>
                {projectTabLabel(p)} ({count})
              </option>
            );
            })}
          </select>

          {/* Focus on project button */}
          {onFocusProject && !isAllProjects && !isTimeFilter && selectedProjectId !== DEFAULT_PROJECT_ID && (
            <button
              onClick={() => onFocusProject(selectedProjectId)}
              className="flex-shrink-0 touch-target-sm p-2 rounded-lg text-slate-400 dark:text-slate-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
              title="Focus on this project"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          )}

          {/* Add project button */}
          <button
            onClick={() => { setShowAddProject(!showAddProject); setNewProjectName(""); }}
            className={`flex-shrink-0 touch-target-sm p-2 rounded-lg transition-colors ${
              showAddProject
                ? "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400"
                : "text-slate-400 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#131d30] hover:text-slate-600 dark:hover:text-slate-300"
            }`}
            title="Add project"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>

          {/* More / manage button */}
          <button
            onClick={openProjectManage}
            className={`flex-shrink-0 touch-target-sm p-2 rounded-lg transition-colors ${
              projectManageOpen
                ? "bg-slate-200 dark:bg-[#1a2d4a] text-slate-700 dark:text-slate-200"
                : "text-slate-400 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#131d30] hover:text-slate-600 dark:hover:text-slate-300"
            }`}
            title="Manage projects"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v.01M12 12v.01M12 18v.01" />
            </svg>
          </button>
        </div>

        {/* Desktop: horizontal scrolling project tabs */}
        <div className="hidden sm:block relative" ref={projectTabsContainerRef}>
          <div
            ref={projectTabMeasureRef}
            className="absolute left-0 top-0 -z-10 opacity-0 pointer-events-none flex items-center gap-2"
            aria-hidden
          >
            {sortedProjects.map((p) => {
              const count = isTimeFilter
                ? timeScopedTasks.filter((t) => t.projectId === p.id && !t.completed).length
                : tasks.filter((t) => t.projectId === p.id && !t.completed).length;
              return (
                <button
                  key={p.id}
                  type="button"
                  tabIndex={-1}
                  data-measure-tab
                  className={`flex-shrink-0 flex items-center gap-2 px-3.5 py-1.5 text-sm font-medium rounded-lg ${PROJECT_TAB_INACTIVE}`}
                >
                  {p.favorite && (
                    <svg className="w-3 h-3 text-amber-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  )}
                  {p.color && (
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                  )}
                  <span className="min-w-0 max-w-[10rem] sm:max-w-[14rem]">
                    <ProjectTabName project={p} />
                  </span>
                  {count > 0 && (
                    <>
                      <span className="shrink-0 text-slate-400/80 dark:text-slate-500/80" aria-hidden>·</span>
                      <span className="text-xs tabular-nums shrink-0 text-slate-500 dark:text-slate-500">{count}</span>
                    </>
                  )}
                </button>
              );
            })}
            <button
              type="button"
              tabIndex={-1}
              data-measure-more
              className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 text-sm font-medium rounded-lg text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-[#131d30]"
            >
              +99 more
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          <div className="flex flex-nowrap items-center gap-2 overflow-x-auto scrollbar-hide pr-8">
          <button
            ref={allProjectsTabRef}
            onClick={() => selectProjectScope(ALL_PROJECTS_ID)}
            className={`flex-shrink-0 flex items-center gap-2 px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              isAllProjectsScopeActive ? PROJECT_TAB_ACTIVE : PROJECT_TAB_INACTIVE
            }`}
            title={`All projects — ${allOpenCount} open, ${todayOpenCount} due today`}
          >
            <span className="truncate max-w-[100px]">All projects</span>
            <span
              className="text-slate-400/80 dark:text-slate-500/80 shrink-0 select-none"
              aria-hidden
            >
              ·
            </span>
            <span
              className={`text-xs tabular-nums shrink-0 ${
                isAllProjectsScopeActive ? "text-cyan-600 dark:text-cyan-300" : "text-slate-500 dark:text-slate-500"
              }`}
              title={`${allOpenCount} open · ${todayOpenCount} due today`}
            >
              {isTimeFilter
                ? timeScopedTasks.filter((t) => !t.completed).length
                : todayOpenCount > 0
                  ? `${todayOpenCount} today`
                  : allOpenCount}
            </span>
          </button>
          {visibleProjectTabs.map((p) => {
            const count = isTimeFilter
              ? timeScopedTasks.filter((t) => t.projectId === p.id && !t.completed).length
              : tasks.filter((t) => t.projectId === p.id && !t.completed).length;
            const tabActive = isTimeFilter
              ? projectFilterId === p.id
              : selectedProjectId === p.id;
            return (
            <button
              key={p.id}
              draggable
              onDragStart={() => handleProjectDragStart(p.id)}
              onDragOver={(e) => handleProjectDragOver(e, p.id)}
              onDrop={(e) => {
                e.preventDefault();
                handleProjectDrop(p.id);
              }}
              onDragEnd={handleProjectDragEnd}
              onClick={() => {
                if (projectDidDragRef.current) return;
                selectProjectScope(p.id);
              }}
              className={`flex-shrink-0 flex items-center gap-2 px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors cursor-grab active:cursor-grabbing ${
                tabActive ? PROJECT_TAB_ACTIVE : PROJECT_TAB_INACTIVE
              } ${dragProjectId === p.id ? "opacity-50" : ""} ${
                dragOverProjectId === p.id && dragProjectId !== p.id
                  ? "ring-2 ring-cyan-400/70 ring-offset-1 ring-offset-transparent"
                  : ""
              }`}
              title={`${projectTabTooltip(p)} — drag to reorder`}
            >
              {p.favorite && (
                <svg className="w-3 h-3 text-amber-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              )}
              {p.color && (
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
              )}
              <span className="min-w-0 max-w-[10rem] sm:max-w-[14rem]" title={projectTabTooltip(p)}>
                <ProjectTabName project={p} />
              </span>
              {count > 0 && (
                <>
                  <span
                    className={`shrink-0 select-none ${
                      tabActive ? "text-cyan-500/80 dark:text-cyan-400/80" : "text-slate-400/80 dark:text-slate-500/80"
                    }`}
                    aria-hidden
                  >
                    ·
                  </span>
                  <span
                    className={`text-xs tabular-nums shrink-0 ${
                      tabActive ? "text-cyan-600 dark:text-cyan-300" : "text-slate-500 dark:text-slate-500"
                    }`}
                  >
                    {count}
                  </span>
                </>
              )}
            </button>
            );
          })}

          {overflowProjectTabs.length > 0 && (
            <button
              onClick={() => {
                setShowOverflowProjectMenu((prev) => !prev);
                closeProjectManage();
              }}
              className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                showOverflowProjectMenu
                  ? "bg-slate-200 dark:bg-[#1a2d4a] text-slate-700 dark:text-slate-200"
                  : "text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-[#131d30] hover:bg-slate-200 dark:hover:bg-[#1a2d4a]"
              }`}
              title={overflowProjectTabs.map((p) => p.name).join(", ")}
              aria-label={`${overflowProjectTabs.length} more projects`}
            >
              +{overflowProjectTabs.length} more
              <svg className={`w-3.5 h-3.5 transition-transform ${showOverflowProjectMenu ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}

          <div ref={projectTabsToolbarRef} className="flex items-center gap-2 flex-shrink-0">
          {/* Add project button */}
          <button
            onClick={() => { setShowAddProject(!showAddProject); setNewProjectName(""); }}
            className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${
              showAddProject
                ? "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400"
                : "text-slate-400 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#131d30] hover:text-slate-600 dark:hover:text-slate-300"
            }`}
            title="Add project"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>

          {/* More / manage button */}
          <button
            onClick={openProjectManage}
            className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${
              projectManageOpen
                ? "bg-slate-200 dark:bg-[#1a2d4a] text-slate-700 dark:text-slate-200"
                : "text-slate-400 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#131d30] hover:text-slate-600 dark:hover:text-slate-300"
            }`}
            title="Manage projects"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v.01M12 12v.01M12 18v.01" />
            </svg>
          </button>
          </div>
          </div>
          {/* Fade hint for scrollable overflow */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-[#111827] to-transparent" />

          {showOverflowProjectMenu && overflowProjectTabs.length > 0 && (
            <div className="absolute right-10 top-full mt-1 w-64 bg-white dark:bg-[#131d30] border border-slate-200 dark:border-[#243350] rounded-lg shadow-lg z-50 overflow-hidden animate-slide-up">
              <div className="max-h-64 overflow-y-auto py-1">
                {overflowProjectTabs.map((p) => {
                  const count = tasks.filter((t) => t.projectId === p.id && !t.completed).length;
                  return (
                    <button
                      key={p.id}
                      onClick={() => selectProjectScope(p.id)}
                      className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors ${
                        (isTimeFilter ? projectFilterId : selectedProjectId) === p.id
                          ? "bg-cyan-50 dark:bg-cyan-900/25 text-cyan-700 dark:text-cyan-200"
                          : "text-slate-700 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-[#1a2d4a]"
                      }`}
                      title={projectTabTooltip(p)}
                    >
                      {p.color && (
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                      )}
                      <span className="truncate flex-1" title={projectTabTooltip(p)}>{projectTabLabel(p)}</span>
                      {count > 0 && (
                        <span className="text-xs text-slate-400 dark:text-slate-500">{count}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Inline add project input */}
        {showAddProject && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addProject();
              setShowAddProject(false);
            }}
            className="flex gap-1.5 mt-2"
          >
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Project name..."
              maxLength={MAX_PROJECT_NAME}
              className="flex-1 px-2.5 py-1.5 text-sm border border-slate-200 dark:border-[#243350] rounded-lg bg-white dark:bg-[#131d30] dark:text-white outline-none focus:border-cyan-400"
              autoFocus
              onKeyDown={(e) => { if (e.key === "Escape") setShowAddProject(false); }}
            />
            <button
              type="submit"
              disabled={!newProjectName.trim()}
              className="px-2.5 py-1.5 text-sm bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Add
            </button>
          </form>
        )}

      </div>

      <div className="task-list-composer px-3 sm:px-4 py-2 space-y-1.5">
        {/* Project description */}
        {!isAllProjects && !isTimeFilter && currentProject && currentProject.id !== DEFAULT_PROJECT_ID && (
          <div className="space-y-2">
            {/* Due date */}
            {currentProject.dueDate && (
              <div className={`flex items-center gap-1.5 text-xs ${isDueDateOverdue(currentProject.dueDate) ? "text-red-500" : "text-slate-500 dark:text-slate-400"}`}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Due {formatDueDate(currentProject.dueDate)}
              </div>
            )}
            {editingProjectDescId === currentProject.id ? (
              <div>
                <textarea
                  value={editProjectDesc}
                  onChange={(e) => setEditProjectDesc(e.target.value)}
                  onBlur={saveProjectDesc}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setEditingProjectDescId(null);
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) saveProjectDesc();
                  }}
                  placeholder="Add a project description..."
                  maxLength={500}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-cyan-300 rounded-lg bg-white dark:bg-[#131d30] dark:text-white outline-none resize-y"
                  autoFocus
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 px-1">Auto-saves when you click outside · ⌘Enter to save</p>
              </div>
            ) : (
              <button
                onClick={() => {
                  setEditingProjectDescId(currentProject.id);
                  setEditProjectDesc(currentProject.description ?? "");
                }}
                className="w-full text-left px-3 py-2 text-sm rounded-lg border border-dashed border-slate-200 dark:border-[#243350] hover:border-cyan-300 dark:hover:border-cyan-600 hover:bg-slate-50 dark:hover:bg-[#1a2d4a] transition-colors"
              >
                {currentProject.description ? (
                  <span className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{currentProject.description}</span>
                ) : (
                  <span className="text-slate-400 dark:text-slate-400">Add a project description...</span>
                )}
              </button>
            )}
          </div>
        )}

        {/* Add task input */}
        <div className="flex flex-col gap-1.5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addTask();
          }}
          className="flex flex-col gap-1.5 sm:flex-row min-w-0 w-full"
        >
          <input
            id="new-task-input"
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Task name..."
            maxLength={MAX_TASK_TITLE}
            className="app-placeholder w-full min-w-0 sm:flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-[#243350] rounded-lg bg-white dark:bg-[#131d30] dark:text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-200 outline-none"
          />
          <div className="flex gap-2 min-w-0 w-full sm:w-auto">
          <label htmlFor="new-task-project" className="sr-only">
            Project
          </label>
          <select
            id="new-task-project"
            value={
              sortedProjects.some((p) => p.id === newTaskProjectId)
                ? newTaskProjectId
                : DEFAULT_PROJECT_ID
            }
            onChange={(e) => setNewTaskProjectId(e.target.value)}
            className="app-placeholder flex-1 min-w-0 sm:flex-none sm:max-w-[11rem] px-2.5 py-2 text-sm border border-slate-200 dark:border-[#243350] rounded-lg bg-white dark:bg-[#131d30] dark:text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-200 outline-none truncate"
            aria-label="Project"
            title="Project"
          >
            {sortedProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <div className="relative flex-1 min-w-0 sm:flex-shrink-0 sm:max-w-[9.5rem]">
            <input
              ref={newTaskDueDateInputRef}
              id="new-task-due-date"
              type="date"
              value={newTaskDueDate}
              onChange={(e) => setNewTaskDueDate(e.target.value)}
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
            />
            <button
              type="button"
              onClick={() => openDatePicker(newTaskDueDateInputRef.current)}
              className={`flex items-center gap-1 min-w-0 w-full h-full px-2.5 py-2 text-sm border rounded-lg transition-colors ${
                newTaskDueDate
                  ? "border-cyan-300 dark:border-cyan-700 bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400"
                  : "border-slate-200 dark:border-[#243350] bg-white dark:bg-[#131d30] text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-slate-100 hover:border-slate-300 dark:hover:border-[#3a5070]"
              }`}
              aria-label={newTaskDueDate ? `Due date: ${formatDueDate(newTaskDueDate)}. Click to change.` : "Set due date"}
              title={newTaskDueDate ? `Due: ${formatDueDate(newTaskDueDate)}` : "Set due date"}
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {newTaskDueDate ? (
                <>
                  <span className="truncate font-semibold sm:hidden">{formatDueDate(newTaskDueDate)}</span>
                  <span className="hidden sm:inline font-medium whitespace-nowrap">Due Date</span>
                  <span className="hidden sm:inline text-xs font-semibold whitespace-nowrap">({formatDueDate(newTaskDueDate)})</span>
                </>
              ) : (
                <>
                  <span className="font-medium sm:hidden">Due</span>
                  <span className="hidden sm:inline font-medium whitespace-nowrap">Due Date</span>
                </>
              )}
            </button>
          </div>
          <button
            type="submit"
            disabled={!newTaskTitle.trim()}
            className="flex-shrink-0 px-4 py-2 bg-cyan-600 text-white text-sm font-semibold rounded-lg hover:bg-cyan-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm touch-target-sm"
          >
            Add
          </button>
          </div>
        </form>

        {tasksReady && tasks.filter((t) => !t.archivedAt && !t.completed).length === 0 && !isTimeFilter && !focusMode && (
          <div className="flex flex-wrap gap-1.5">
            <span className="text-xs text-slate-500 dark:text-slate-400 w-full">Quick start:</span>
            {TASK_TEMPLATES.slice(0, 3).map((tpl) => (
              <button
                key={tpl.label}
                type="button"
                onClick={() => applyTemplate(tpl)}
                className="px-2.5 py-1.5 text-xs font-medium rounded-full border border-slate-200 dark:border-[#243350] hover:border-cyan-400 dark:hover:border-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-colors touch-target-sm"
              >
                {tpl.emoji} {tpl.label}
              </button>
            ))}
          </div>
        )}
        </div>
      </div>

        <div className="task-list-body px-3 sm:px-4 pt-2 pb-1.5 space-y-1.5">
        {/* Loading skeleton */}
        {!tasksReady && (
          <div className="space-y-2 py-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl animate-pulse">
                <div className="w-6 h-6 rounded-md bg-slate-200 dark:bg-slate-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md w-3/4" />
                  <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-md w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state with template gallery */}
        {tasksReady && pendingTasks.length === 0 && completedTasks.length === 0 && (
          <div className="py-4">
            <div className="text-center mb-6 px-4">
              <div className="text-5xl mb-3">📝</div>
              <p className="text-slate-700 dark:text-slate-200 text-lg font-semibold mb-2">
                {isTimeFilter 
                  ? `No tasks due ${isTodayFilter ? "today" : isThisWeekFilter ? "this week" : isThisMonthFilter ? "this month" : "this year"}` 
                  : "Your task list is empty"}
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">
                {isTimeFilter 
                  ? "Add a task above to get started" 
                  : "Add your first task above to get started, or choose a template below"}
              </p>
            </div>
            {!isTimeFilter && (
            <div className="grid grid-cols-2 gap-2">
              {TASK_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.label}
                  type="button"
                  onClick={() => applyTemplate(tpl)}
                  className="text-left p-3 rounded-xl border border-slate-100 dark:border-[#1e3050] hover:border-purple-200 dark:hover:border-purple-700 hover:bg-purple-50/50 dark:hover:bg-purple-900/20 transition-all group"
                >
                  <div className="text-xl mb-1">{tpl.emoji}</div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-100 group-hover:text-purple-700 dark:group-hover:text-purple-200 transition-colors">{tpl.label}</div>
                  <div className="text-sm text-slate-400 dark:text-slate-300">{tpl.tasks.length} tasks</div>
                </button>
              ))}
            </div>
            )}
          </div>
        )}

        {/* First session nudge handled by AppMessageQueue on /app */}

        <OpenTaskList
          tasks={pendingTasks}
          activeTaskId={activeTaskId}
          isTimerRunning={isTimerRunning}
          expandedTaskId={expandedTaskId}
          editingId={editingId}
          editTitle={editTitle}
          dragTaskId={dragTaskId}
          dragOverTaskId={dragOverTaskId}
          showProjectBadge
          isTimeFilter={isTimeFilter}
          isAllProjects={isAllProjects}
          getProjectName={getProjectName}
          noDueDateExpanded={noDueDateExpanded}
          onToggleNoDueDateExpanded={() => setNoDueDateExpanded((open) => !open)}
          scopedUndatedOpenCount={scopedUndatedOpenCount}
          somedayExpanded={somedayExpanded}
          onToggleSomedayExpanded={() => setSomedayExpanded((open) => !open)}
          scopedSomedayOpenCount={scopedSomedayOpenCount}
          twoColumn={viewMode === "list"}
          onToggleComplete={toggleComplete}
          onSaveEdit={saveEdit}
          onStartEdit={startEditing}
          onEditTitleChange={setEditTitle}
          onCancelEdit={() => setEditingId(null)}
          onToggleTaskDetail={toggleTaskDetail}
          onStartTask={onStartTask}
          onSelectTask={onSelectTask}
          onDeleteTask={deleteTask}
          onSetDueDate={setDueDate}
          onSnoozeToToday={snoozeToToday}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          renderBelowTask={renderTaskInlineExpansion}
          {...createTaskListDnD(pendingTasks)}
        />

        {/* Completed tasks */}
        {completedTasks.length > 0 && (
          <div className="pt-2 border-t border-slate-100 dark:border-[#1e3050]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="app-section-label text-slate-500 dark:text-slate-300">
                Completed ({completedTasks.length})
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={archiveCompleted}
                  className="text-sm text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors flex items-center gap-1"
                  title="Archive completed tasks"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  Archive
                </button>
                <button
                  onClick={() => {
                    setPendingConfirm({
                      title: "Clear completed tasks",
                      message: `Delete ${completedTasks.length} completed task${completedTasks.length !== 1 ? "s" : ""}? This cannot be undone.`,
                      confirmLabel: "Delete",
                      onConfirm: () => {
                        setPendingConfirm(null);
                        clearCompleted();
                      },
                    });
                  }}
                  className="text-sm text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="space-y-1">
              {completedTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-[#131d30] transition-colors"
                >
                  <button
                    onClick={() => toggleComplete(task.id)}
                    className="flex-shrink-0 w-5 h-5 rounded border-2 border-green-400 bg-green-500 flex items-center justify-center"
                    aria-label={`Mark "${task.title}" incomplete`}
                  >
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </button>
                  <span className="text-sm text-slate-400 dark:text-slate-400 line-through truncate">
                    {task.title}
                    {(isAllProjects || isTimeFilter) && (
                      <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded bg-slate-100 dark:bg-[#1a2d4a] text-slate-500 dark:text-slate-300 align-middle no-underline">
                        {getProjectName(task.projectId)}
                      </span>
                    )}
                  </span>
                  {((task.timeSpent || 0) > 0 || task.sessions > 0) && (
                    <span className="text-xs text-slate-400 dark:text-slate-400 ml-auto flex-shrink-0">
                      {(task.timeSpent || 0) > 0 ? formatDuration(task.timeSpent) : `${task.sessions}s`}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Archived tasks */}
        {viewMode === "list" && archivedTasks.length > 0 && (
          <div className="pt-2 border-t border-slate-100 dark:border-[#1e3050]">
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="flex items-center gap-1.5 app-section-label text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors w-full"
            >
              <svg className={`w-3 h-3 transition-transform ${showArchived ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              Archived ({archivedTasks.length})
              <span className="ml-auto">
                {showArchived && (
                  <span
                    onClick={(e) => { e.stopPropagation(); deleteArchivedTasks(); }}
                    className="text-xs normal-case font-normal text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    Delete all
                  </span>
                )}
              </span>
            </button>
            {showArchived && (
              <div className="space-y-1 mt-1.5">
                {archivedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="group flex items-center gap-2 p-2 rounded-lg"
                  >
                    <svg className="w-4 h-4 flex-shrink-0 text-slate-400 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                    <span className="text-sm text-slate-400 dark:text-slate-400 line-through truncate">
                      {task.title}
                    </span>
                    <button
                      onClick={() => unarchiveTask(task.id)}
                      className="ml-auto flex-shrink-0 text-xs text-slate-400 hover:text-cyan-500 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
                      title="Unarchive"
                    >
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      </>)}

      {/* Bucket task detail drawer — keeps column layout stable */}
      {viewMode === "bucket" && expandedTaskId && (() => {
        const task = tasks.find((t) => t.id === expandedTaskId);
        if (!task) return null;
        return (
          <TaskExpansionDrawer task={task} onClose={closeTaskDetail}>
            {renderTaskExpansionContent(task, true)}
          </TaskExpansionDrawer>
        );
      })()}

      {/* Confirmation Modal */}
      {pendingConfirm && (
        <ConfirmModal
          title={pendingConfirm.title}
          message={pendingConfirm.message}
          confirmLabel={pendingConfirm.confirmLabel}
          variant="danger"
          onConfirm={pendingConfirm.onConfirm}
          onCancel={() => setPendingConfirm(null)}
        />
      )}

      {/* Share Project Modal */}
      {shareModalProject && (
        <ShareProjectModal
          project={shareModalProject}
          isOpen={true}
          onClose={() => setShareModalProject(null)}
        />
      )}
    </div>
  );
}
