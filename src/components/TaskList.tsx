"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Task, Project, Settings, DEFAULT_SETTINGS, DEFAULT_PROJECT, DEFAULT_PROJECT_ID, ALL_PROJECTS_ID, TODAY_FILTER_ID, THIS_WEEK_FILTER_ID, THIS_MONTH_FILTER_ID, THIS_YEAR_FILTER_ID, Subtask, PROJECT_COLORS, RecurrenceType, TaskPriority } from "@/lib/types";
import { loadTasks, saveTasks, saveTask as saveOneTask, loadProjects, saveProjects, saveSelectedProjectId, deleteTask as removeTaskFromDB, deleteTasks as removeTasksFromDB, deleteProject as removeProjectFromDB, loadSettings, getSharedProjects, loadSharedProjectTasks, updateSharedTask, leaveProject, SharedProject, isSharedProjectFn } from "@/lib/storage";
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
import TaskBucketView from "@/components/task-list/TaskBucketView";
import { TaskDetailDrawer, TaskDetailPanel } from "@/components/task-list/TaskDetailPanel";
import ProjectManageView from "@/components/task-list/ProjectManageView";
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
} from "@/components/task-list/utils";
import { ProjectTabName } from "@/components/task-list/ProjectTabName";
import TaskPanelQuote from "@/components/TaskPanelQuote";

/** Neutral active state for time/view filters (not a primary CTA). */
const FILTER_TAB_ACTIVE =
  "bg-white dark:bg-[#1a2d4a] text-slate-800 dark:text-slate-100 shadow-sm ring-1 ring-slate-300/70 dark:ring-[#3a5070] font-semibold";
const FILTER_TAB_INACTIVE =
  "text-slate-600 dark:text-white/80 hover:text-slate-800 dark:hover:text-white hover:bg-slate-300/60 dark:hover:bg-white/10";

/** Soft outline for project scope (distinct from Add / Start buttons). */
const PROJECT_TAB_ACTIVE =
  "bg-white dark:bg-[#1a2d4a] text-slate-800 dark:text-slate-100 shadow-sm ring-1 ring-blue-400/50 dark:ring-blue-500/45 font-semibold";
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  // Project state
  const [projects, setProjects] = useState<Project[]>([DEFAULT_PROJECT]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(TODAY_FILTER_ID);
  /** When viewing Today/Week/Month/Year, filters tasks within that scope (All projects or one project). */
  const [projectFilterId, setProjectFilterId] = useState<string>(ALL_PROJECTS_ID);
  const [projectManageOpen, setProjectManageOpen] = useState(false);
  const [showOverflowProjectMenu, setShowOverflowProjectMenu] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [showAddProject, setShowAddProject] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editProjectName, setEditProjectName] = useState("");
  const [editingProjectDescId, setEditingProjectDescId] = useState<string | null>(null);
  const [editProjectDesc, setEditProjectDesc] = useState("");
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [noDueDateExpanded, setNoDueDateExpanded] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editSubtaskTitle, setEditSubtaskTitle] = useState("");
  const [editingDescId, setEditingDescId] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<TaskViewMode>(() => {
    if (typeof window === "undefined") return "bucket";
    const saved = localStorage.getItem("foci_task_view_mode");
    const explicit = localStorage.getItem("foci_task_view_explicit") === "1";
    const valid =
      saved === "bucket" || saved === "list" || saved === "calendar" || saved === "plan";
    if (explicit && valid) return saved;
    return "bucket";
  });

  const viewBeforePlanRef = useRef<TaskViewMode>("bucket");
  const viewBeforeManageRef = useRef<TaskViewMode>("bucket");

  const openProjectManage = useCallback(() => {
    viewBeforeManageRef.current =
      viewMode === "calendar" || viewMode === "list" || viewMode === "bucket"
        ? viewMode
        : "bucket";
    setProjectManageOpen(true);
  }, [viewMode]);

  const closeProjectManage = useCallback(() => {
    setProjectManageOpen(false);
    setEditingProjectId(null);
  }, []);

  const selectViewMode = useCallback((mode: TaskViewMode) => {
    setViewMode(mode);
    if (mode !== "plan") {
      localStorage.setItem("foci_task_view_mode", mode);
      localStorage.setItem("foci_task_view_explicit", "1");
    }
  }, []);

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

  useEffect(() => {
    const open = () => openProjectManage();
    window.addEventListener("foci-open-project-menu", open);
    return () => window.removeEventListener("foci-open-project-menu", open);
  }, [openProjectManage]);
  const newTaskDueDateInputRef = useRef<HTMLInputElement>(null);

  // Close project menus on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (projectMenuRef.current && !projectMenuRef.current.contains(e.target as Node)) {
        setProjectManageOpen(false);
        setShowOverflowProjectMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

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
        const [existingProjects, existing] = await Promise.all([loadProjects(), loadTasks()]);
        setProjects(existingProjects);

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

        setTasksReady(true);
      } catch (err) {
        console.error("[Foci] Failed to load data:", err);
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
    setProjectManageOpen(false);
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
      setProjectManageOpen(false);
      setShowOverflowProjectMenu(false);
      return;
    }
    selectProject(projectId);
  };

  // Select a shared project and load its tasks
  const selectSharedProject = async (shared: SharedProject) => {
    setSelectedSharedProject(shared);
    setSelectedProjectId(`shared:${shared._ownerId}:${shared.id}`);
    setProjectManageOpen(false);
    
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

  const addTask = () => addTaskWithTitle(newTaskTitle);

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

  const handleDrop = (targetId: string) => {
    if (!dragTaskId || dragTaskId === targetId) {
      setDragTaskId(null);
      setDragOverTaskId(null);
      return;
    }

    // Reorder within pendingTasks
    const ordered = [...pendingTasks];
    const fromIdx = ordered.findIndex((t) => t.id === dragTaskId);
    const toIdx = ordered.findIndex((t) => t.id === targetId);
    if (fromIdx === -1 || toIdx === -1) {
      setDragTaskId(null);
      setDragOverTaskId(null);
      return;
    }

    const [moved] = ordered.splice(fromIdx, 1);
    ordered.splice(toIdx, 0, moved);

    // Assign order values
    const orderMap = new Map<string, number>();
    ordered.forEach((t, i) => orderMap.set(t.id, i));

    const updated = tasks.map((t) =>
      orderMap.has(t.id) ? { ...t, order: orderMap.get(t.id)! } : t
    );
    persist(updated);
    setDragTaskId(null);
    setDragOverTaskId(null);
  };

  const handleDragEnd = () => {
    setDragTaskId(null);
    setDragOverTaskId(null);
  };

  const moveTask = (taskId: string, direction: "up" | "down") => {
    const ordered = [...pendingTasks];
    const idx = ordered.findIndex((t) => t.id === taskId);
    if (idx === -1) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= ordered.length) return;

    [ordered[idx], ordered[targetIdx]] = [ordered[targetIdx], ordered[idx]];

    const orderMap = new Map<string, number>();
    ordered.forEach((t, i) => orderMap.set(t.id, i));

    const updated = tasks.map((t) =>
      orderMap.has(t.id) ? { ...t, order: orderMap.get(t.id)! } : t
    );
    persist(updated);
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

  const toggleBucketTaskDetail = (taskId: string) => {
    setExpandedTaskId((current) => {
      const next = current === taskId ? null : taskId;
      if (next !== current) setNewSubtaskTitle("");
      return next;
    });
  };

  const closeBucketTaskDetail = () => {
    setExpandedTaskId(null);
    setNewSubtaskTitle("");
  };

  // Filter tasks for the selected project
  const isAllProjects = selectedProjectId === ALL_PROJECTS_ID;
  const activeProjects = projects.filter((p) => !p.archived);
  const archivedProjects = projects.filter((p) => p.archived);
  const sortedProjects = sortProjectsForDisplay(activeProjects);
  const isTodayFilter = selectedProjectId === TODAY_FILTER_ID;
  const isThisWeekFilter = selectedProjectId === THIS_WEEK_FILTER_ID;
  const isThisMonthFilter = selectedProjectId === THIS_MONTH_FILTER_ID;
  const isThisYearFilter = selectedProjectId === THIS_YEAR_FILTER_ID;
  const isTimeFilter = isTodayFilter || isThisWeekFilter || isThisMonthFilter || isThisYearFilter;
  const activeProjectTabId = isTimeFilter
    ? projectFilterId
    : isAllProjects
      ? null
      : selectedProjectId;
  const visibleProjectTabs = (() => {
    const tabs = sortedProjects.slice(0, MAX_VISIBLE_PROJECT_TABS);
    if (!activeProjectTabId || activeProjectTabId === ALL_PROJECTS_ID) return tabs;
    if (!sortedProjects.some((p) => p.id === activeProjectTabId)) return tabs;
    if (tabs.some((p) => p.id === activeProjectTabId)) return tabs;
    return [
      ...tabs.slice(0, Math.max(0, MAX_VISIBLE_PROJECT_TABS - 1)),
      sortedProjects.find((p) => p.id === activeProjectTabId)!,
    ];
  })();
  const visibleProjectTabIds = new Set(visibleProjectTabs.map((p) => p.id));
  const overflowProjectTabs = sortedProjects.filter((p) => !visibleProjectTabIds.has(p.id));

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
  const overdueTasks = tasks.filter((t) => !t.archivedAt && !t.completed && t.dueDate && isDueDateOverdue(t.dueDate));
  const thisWeekTasks = tasks.filter((t) => !t.archivedAt && !t.completed && t.dueDate && (t.dueDate <= endOfWeek));
  const thisMonthTasks = tasks.filter((t) => !t.archivedAt && !t.completed && t.dueDate && (t.dueDate <= endOfMonth));
  const thisYearTasks = tasks.filter((t) => !t.archivedAt && !t.completed && t.dueDate && (t.dueDate <= endOfYear));
  const undatedOpenTasks = tasks.filter((t) => !t.archivedAt && !t.completed && !t.dueDate);
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
    ? [...timeScopedDatedTasks, ...undatedOpenTasks]
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
  const pendingTasks = projectTasks
    .filter((t) => !t.completed)
    .sort((a, b) => {
      // Pin the active task to the top
      if (a.id === activeTaskId && b.id !== activeTaskId) return -1;
      if (b.id === activeTaskId && a.id !== activeTaskId) return 1;
      
      // Overdue tasks come first (before today)
      const aOverdue = a.dueDate && isDueDateOverdue(a.dueDate);
      const bOverdue = b.dueDate && isDueDateOverdue(b.dueDate);
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
    ? projectTasks.filter((t) => !t.completed && !t.dueDate).length
    : 0;
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
  const bucketOpenTasks = timeScopedTasks.filter((t) => !t.completed && !t.archivedAt);
  const bucketDatedCount = bucketOpenTasks.filter((t) => t.dueDate).length;
  const bucketUndatedCount = bucketOpenTasks.filter((t) => !t.dueDate).length;
  const bucketTasksByProject = new Map<string, Task[]>();
  for (const project of sortedProjects) {
    bucketTasksByProject.set(
      project.id,
      bucketOpenTasks.filter((t) => t.projectId === project.id)
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

  return (
    <div className="app-surface rounded-2xl dark:bg-[#111827] dark:border-[#1e3050] overflow-hidden min-w-0">

      {/* Focus mode header */}
      {isFocusMode ? (
        <div
          className="panel-header-calm px-3 sm:px-5 py-2.5 sm:py-3 text-slate-700 dark:text-white rounded-t-2xl"
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
        className="panel-header-calm px-3 sm:px-5 py-2.5 sm:py-3 text-slate-700 dark:text-white rounded-t-2xl"
      >
        <div className="flex items-center justify-between min-w-0 gap-2">
          <div className="min-w-0 flex-shrink">
            <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
              <svg
                className="w-5 h-5 flex-shrink-0"
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
                {projectManageOpen ? "Projects" : "Tasks"}
                {!projectManageOpen && viewMode === "plan" && (
                  <span className="text-sm font-medium text-indigo-600 dark:text-indigo-300 normal-case tracking-normal">
                    {" "}· AI plan
                  </span>
                )}
              </span>
            </h2>
            {!focusMode && projectManageOpen && (
              <p className="text-xs text-slate-500 dark:text-slate-400 font-normal normal-case tracking-normal mt-0.5 pl-7 hidden sm:block">
                Star favorites · expand a project to see tasks
              </p>
            )}
            {!focusMode && !projectManageOpen && (viewMode === "list" || viewMode === "bucket") && (
              <p className="text-xs text-slate-500 dark:text-slate-400 font-normal normal-case tracking-normal mt-0.5 pl-7 hidden sm:block">
                {viewMode === "bucket"
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
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 min-w-0">
            {/* Time filters - hidden on mobile, shown inline on sm+ */}
            {!focusMode && !projectManageOpen && (
            <div className="app-seg-track hidden sm:flex items-center gap-1" data-tour="time-filters">
              <button
                onClick={() => selectProject(TODAY_FILTER_ID)}
                className={`px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors relative ${isTodayFilter ? FILTER_TAB_ACTIVE : FILTER_TAB_INACTIVE}`}
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
                className={`px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors ${isThisWeekFilter ? FILTER_TAB_ACTIVE : FILTER_TAB_INACTIVE}`}
                title="Tasks with a due date this week or earlier"
                aria-label="Due this week or earlier"
              >
                Week
              </button>
              <button
                onClick={() => selectProject(THIS_MONTH_FILTER_ID)}
                className={`px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors ${isThisMonthFilter ? FILTER_TAB_ACTIVE : FILTER_TAB_INACTIVE}`}
                title="Tasks with a due date this month or earlier"
                aria-label="Due this month or earlier"
              >
                Month
              </button>
              <button
                onClick={() => selectProject(THIS_YEAR_FILTER_ID)}
                className={`px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors ${isThisYearFilter ? FILTER_TAB_ACTIVE : FILTER_TAB_INACTIVE}`}
                title="Tasks with a due date this year or earlier"
                aria-label="Due this year or earlier"
              >
                Year
              </button>
            </div>
            )}
            {/* View mode — mobile dropdown */}
            {!projectManageOpen && (
            <select
              value={viewMode}
              onChange={(e) => selectViewMode(e.target.value as TaskViewMode)}
              className="sm:hidden text-xs font-medium rounded-lg border border-slate-200 dark:border-[#243350] bg-white dark:bg-[#131d30] text-slate-700 dark:text-slate-200 px-2 py-2 touch-target-sm"
              aria-label="Task view mode"
              data-tour="view-modes"
            >
              <option value="bucket">Buckets</option>
              <option value="list">List</option>
              <option value="calendar">Calendar</option>
              <option value="plan">Smart Plan</option>
            </select>
            )}
            {/* View mode toggles — desktop */}
            {!projectManageOpen && (
            <div className="app-seg-track hidden sm:flex items-center gap-1" data-tour="view-modes">
              <button
                onClick={() => selectViewMode("bucket")}
                className={`p-2.5 rounded-md transition-colors ${viewMode === "bucket" ? "bg-slate-300/70 dark:bg-white/20 text-slate-800 dark:text-white" : "text-slate-400 dark:text-white/50 hover:text-slate-600 dark:hover:text-white/80"}`}
                title="Bucket view — all projects"
                aria-label="Bucket view"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v18M5 3h4a1 1 0 011 1v16a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1zm10 0h4a1 1 0 011 1v16a1 1 0 01-1 1h-4a1 1 0 01-1-1V4a1 1 0 011-1z" />
                </svg>
              </button>
              <button
                onClick={() => selectViewMode("list")}
                className={`p-2.5 rounded-md transition-colors ${viewMode === "list" ? "bg-slate-300/70 dark:bg-white/20 text-slate-800 dark:text-white" : "text-slate-400 dark:text-white/50 hover:text-slate-600 dark:hover:text-white/80"}`}
                title="List view"
                aria-label="List view"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button
                onClick={() => selectViewMode("calendar")}
                className={`p-2.5 rounded-md transition-colors ${viewMode === "calendar" ? "bg-slate-300/70 dark:bg-white/20 text-slate-800 dark:text-white" : "text-slate-400 dark:text-white/50 hover:text-slate-600 dark:hover:text-white/80"}`}
                title="Calendar view"
                aria-label="Calendar view"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
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
                      viewMode === "calendar" || viewMode === "list" || viewMode === "bucket"
                        ? viewMode
                        : "bucket";
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
                className={`p-2.5 rounded-lg transition-colors ${isFullscreen ? "bg-slate-300/70 dark:bg-white/20 text-slate-800 dark:text-white" : "text-slate-400 dark:text-white/50 hover:text-slate-600 dark:hover:text-white/80 hover:bg-slate-200/60 dark:hover:bg-white/10"}`}
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
        {!focusMode && (
        <div className="app-seg-track flex sm:hidden items-center gap-1 mt-3" data-tour="time-filters">
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
          onClose={closeProjectManage}
          onToggleFavorite={toggleProjectFavorite}
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
          onToggleComplete={toggleComplete}
          onStartTask={onStartTask}
          onSelectTask={onSelectTask}
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
        <div className="px-3 sm:px-4 py-1.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 border-b border-slate-100/80 dark:border-[#243350]/60">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
            <button
              type="button"
              onClick={openProjectManage}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg border border-violet-300/80 dark:border-violet-600/50 bg-violet-100/90 dark:bg-violet-950/40 text-violet-900 dark:text-violet-100 shadow-sm hover:bg-violet-200/90 dark:hover:bg-violet-950/60 hover:border-violet-400 dark:hover:border-violet-500 active:scale-[0.98] transition-all"
              data-tour="manage-projects"
            >
              <svg className="w-4 h-4 text-violet-600 dark:text-violet-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m0 4v2m0-2a2 2 0 100 4m0-4a2 2 0 110 4m0 4v2m0-2a2 2 0 100 4m0-4a2 2 0 110 4" />
              </svg>
              Manage projects
            </button>
            <span className="hidden md:inline text-xs text-slate-500 dark:text-slate-400">
              ★ Pin columns to reorder · scroll for more
            </span>
          </div>
          <button
            type="button"
            onClick={() => { setNewProjectName(""); openProjectManage(); }}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-semibold rounded-lg border border-blue-200 dark:border-blue-700/50 bg-blue-50 dark:bg-blue-950/25 text-blue-700 dark:text-blue-300 shadow-sm hover:bg-blue-100 dark:hover:bg-blue-950/40 hover:border-blue-300 dark:hover:border-blue-600 active:scale-[0.98] transition-all shrink-0"
          >
            + New project
          </button>
        </div>
      )}

      {/* Bucket view — all projects as columns */}
      {!isFocusMode && !projectManageOpen && viewMode === "bucket" && !tasksReady && (
        <div className="px-3 sm:px-4 pb-4 pt-1 flex gap-3 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex-[0_0_calc((100%-2.25rem)/4)] min-w-0 rounded-xl border border-slate-200 dark:border-[#243350] p-3 space-y-2 animate-pulse"
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
          activeTaskId={activeTaskId}
          isTimerRunning={isTimerRunning}
          datedLaneLabel={bucketDatedLaneLabel}
          onToggleComplete={toggleComplete}
          onStartTask={onStartTask}
          onSelectTask={onSelectTask}
          onQuickAdd={(title, projectId) => addTaskWithTitle(title, undefined, projectId)}
          onToggleProjectFavorite={toggleProjectFavorite}
          editingTaskId={editingId}
          editTitle={editTitle}
          onStartEdit={startEditing}
          onEditTitleChange={setEditTitle}
          onSaveEdit={saveEdit}
          onCancelEdit={() => setEditingId(null)}
          onSetDueDate={setDueDate}
          expandedTaskId={expandedTaskId}
          onToggleTaskDetail={toggleBucketTaskDetail}
        />
      )}

      {!isFocusMode && !projectManageOpen && viewMode === "bucket" && expandedTaskId && (() => {
        const detailTask = tasks.find(
          (t) => t.id === expandedTaskId && !t.completed && !t.archivedAt
        );
        if (!detailTask) return null;
        return (
          <TaskDetailDrawer task={detailTask} onClose={closeBucketTaskDetail}>
            <TaskDetailPanel
              task={detailTask}
              variant="drawer"
              {...taskDetailPanelProps(detailTask)}
              onDeleteTask={() => {
                deleteTask(detailTask.id);
                closeBucketTaskDetail();
              }}
              onStartTask={() => onStartTask(detailTask.id)}
              onDeselectTask={() => onSelectTask(null)}
            />
          </TaskDetailDrawer>
        );
      })()}

      {/* Project filter — works with Today/Week/Month/Year via projectFilterId */}
      {!isFocusMode && !projectManageOpen && viewMode === "list" && (<>
      <div className="px-3 sm:px-4 pt-1.5 pb-1 relative" ref={projectMenuRef}>
        {isAllProjects && !isTimeFilter && (
          <button
            type="button"
            onClick={() => selectProject(TODAY_FILTER_ID)}
            className="mb-2 w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-orange-200/80 dark:border-orange-800/50 bg-white dark:bg-[#131d30] text-orange-700 dark:text-orange-300 hover:bg-orange-50/80 dark:hover:bg-orange-900/20 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Due today
            {todayOpenCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-orange-500 text-white text-xs font-bold tabular-nums">
                {todayOpenCount}
              </span>
            )}
          </button>
        )}
        {/* Mobile: project dropdown (time scope is in the Tasks header) */}
        <div className="flex sm:hidden items-center gap-1.5">
          <select
            value={isTimeFilter ? projectFilterId : selectedProjectId}
            onChange={(e) => selectProjectScope(e.target.value)}
            className="flex-1 px-3 py-2 text-sm font-medium rounded-lg bg-slate-100 dark:bg-[#131d30] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#243350] outline-none focus:border-blue-400 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%236b7280%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.23%207.21a.75.75%200%20011.06.02L10%2011.168l3.71-3.938a.75.75%200%20111.08%201.04l-4.25%204.5a.75.75%200%2001-1.08%200l-4.25-4.5a.75.75%200%2001.02-1.06z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.5rem_center] bg-no-repeat pr-8"
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
              className="flex-shrink-0 p-2 rounded-lg text-slate-400 dark:text-slate-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
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
            className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
              showAddProject
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
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
            className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
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
        <div className="hidden sm:block relative">
          <div className="flex flex-nowrap items-center gap-2 overflow-x-auto scrollbar-hide pr-8">
          <button
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
                isAllProjectsScopeActive ? "text-blue-600 dark:text-blue-300" : "text-slate-500 dark:text-slate-500"
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
              onClick={() => selectProjectScope(p.id)}
              className={`flex-shrink-0 flex items-center gap-2 px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                tabActive ? PROJECT_TAB_ACTIVE : PROJECT_TAB_INACTIVE
              }`}
              title={projectTabTooltip(p)}
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
                      tabActive ? "text-blue-500/80 dark:text-blue-400/80" : "text-slate-400/80 dark:text-slate-500/80"
                    }`}
                    aria-hidden
                  >
                    ·
                  </span>
                  <span
                    className={`text-xs tabular-nums shrink-0 ${
                      tabActive ? "text-blue-600 dark:text-blue-300" : "text-slate-500 dark:text-slate-500"
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
                setProjectManageOpen(false);
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

          {/* Add project button */}
          <button
            onClick={() => { setShowAddProject(!showAddProject); setNewProjectName(""); }}
            className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${
              showAddProject
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
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
                          ? "bg-blue-50 dark:bg-blue-900/25 text-blue-700 dark:text-blue-200"
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
              className="flex-1 px-2.5 py-1.5 text-sm border border-slate-200 dark:border-[#243350] rounded-lg bg-white dark:bg-[#131d30] dark:text-white outline-none focus:border-blue-400"
              autoFocus
              onKeyDown={(e) => { if (e.key === "Escape") setShowAddProject(false); }}
            />
            <button
              type="submit"
              disabled={!newProjectName.trim()}
              className="px-2.5 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Add
            </button>
          </form>
        )}

      </div>

      {(pendingTasks.length > 0 || completedTasks.length > 0) && <TaskPanelQuote />}

      <div className="px-3 sm:p-4 pt-3 pb-2 space-y-2">
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
                  className="w-full px-3 py-2 text-sm border border-blue-300 rounded-lg bg-white dark:bg-[#131d30] dark:text-white outline-none resize-y"
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
                className="w-full text-left px-3 py-2 text-sm rounded-lg border border-dashed border-slate-200 dark:border-[#243350] hover:border-blue-300 dark:hover:border-blue-600 hover:bg-slate-50 dark:hover:bg-[#1a2d4a] transition-colors"
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
        <div className="flex flex-col gap-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addTask();
          }}
          className="flex flex-col gap-2 sm:flex-row min-w-0 w-full"
        >
          <input
            id="new-task-input"
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder={`Add a task to ${
              isTimeFilter
                ? projectFilterId === ALL_PROJECTS_ID
                  ? "General"
                  : (projects.find((p) => p.id === projectFilterId)?.name ?? "General")
                : isAllProjects
                  ? "General"
                  : (currentProject?.name ?? "General")
            }...`}
            maxLength={MAX_TASK_TITLE}
            className="w-full min-w-0 sm:flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-[#243350] rounded-lg bg-white dark:bg-[#131d30] dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
          />
          <div className="flex gap-2 min-w-0 sm:contents">
          <div className="relative flex-1 min-w-0 sm:flex-shrink-0">
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
                  ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
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
            className="flex-shrink-0 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm touch-target-sm"
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
                className="px-2.5 py-1.5 text-xs font-medium rounded-full border border-slate-200 dark:border-[#243350] hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors touch-target-sm"
              >
                {tpl.emoji} {tpl.label}
              </button>
            ))}
          </div>
        )}
        </div>

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
            <TaskPanelQuote variant="hero" />
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

        <div className="space-y-2">
          {pendingTasks.map((task, index) => {
            const subtasks = task.subtasks || [];
            const completedSubtasks = subtasks.filter((s) => s.completed).length;
            const hasSubtasks = subtasks.length > 0;
            const isExpanded = expandedTaskId === task.id;
            const isOverdue = task.dueDate && isDueDateOverdue(task.dueDate);
            const prevTask = index > 0 ? pendingTasks[index - 1] : null;
            const prevIsOverdue = !!(prevTask?.dueDate && isDueDateOverdue(prevTask.dueDate));
            const showOverdueHeader = isOverdue && !prevIsOverdue;
            const showUpcomingHeader = !isOverdue && prevIsOverdue;
            const showNoDueDateHeader =
              isTimeFilter && !task.dueDate && (index === 0 || !!prevTask?.dueDate);
            const isUndatedInTimeFilter = isTimeFilter && !task.dueDate;

            if (isUndatedInTimeFilter && !noDueDateExpanded) {
              if (!showNoDueDateHeader) return null;
              return (
                <button
                  key="no-due-date-section"
                  type="button"
                  onClick={() => setNoDueDateExpanded(true)}
                  className="mb-2 mt-3 pl-3 py-1.5 border-l-[3px] border-l-slate-300 dark:border-l-slate-600 w-full text-left flex items-center gap-2 hover:bg-slate-50/80 dark:hover:bg-[#131d30]/60 rounded-r-lg transition-colors"
                  aria-expanded={false}
                >
                  <svg
                    className="w-3.5 h-3.5 text-slate-400 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="app-section-label text-slate-600 dark:text-slate-400">No due date</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">
                    ({scopedUndatedOpenCount})
                  </span>
                </button>
              );
            }

            return (
            <div key={task.id}>
            {showNoDueDateHeader && (
              <button
                type="button"
                onClick={() => setNoDueDateExpanded((open) => !open)}
                className="mb-2 mt-3 pl-3 py-1.5 border-l-[3px] border-l-slate-300 dark:border-l-slate-600 w-full text-left flex items-center gap-2 hover:bg-slate-50/80 dark:hover:bg-[#131d30]/60 rounded-r-lg transition-colors"
                aria-expanded={noDueDateExpanded}
              >
                <svg
                  className={`w-3.5 h-3.5 text-slate-400 flex-shrink-0 transition-transform ${noDueDateExpanded ? "rotate-90" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="app-section-label text-slate-600 dark:text-slate-400">No due date</span>
                <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">
                  ({scopedUndatedOpenCount})
                </span>
              </button>
            )}
            {showOverdueHeader && (
              <div className="mb-2 mt-1 pl-3 py-1 border-l-[3px] border-l-red-500 dark:border-l-rose-500">
                <span className="app-section-label text-red-700 dark:text-red-300">Overdue</span>
              </div>
            )}
            {showUpcomingHeader && (
              <div className="mb-2 mt-1 px-2 py-1 rounded-lg border border-slate-200 dark:border-[#243350] bg-slate-50/80 dark:bg-[#131d30]/80 app-section-label text-slate-600 dark:text-slate-300">
                Upcoming
              </div>
            )}
            <div
              draggable
              aria-current={activeTaskId === task.id ? "true" : undefined}
              data-linked-to-timer={activeTaskId === task.id ? "true" : undefined}
              onDragStart={() => handleDragStart(task.id)}
              onDragOver={(e) => handleDragOver(e, task.id)}
              onDrop={() => handleDrop(task.id)}
              onDragEnd={handleDragEnd}
              onClick={() => {
                setExpandedTaskId(isExpanded ? null : task.id);
                setNewSubtaskTitle("");
              }}
              className={`group flex items-start gap-1.5 sm:gap-3 p-2 sm:p-3.5 rounded-xl border transition-colors cursor-pointer ${
                activeTaskId === task.id
                  ? "task-timer-linked border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/25 border-l-[3px] border-l-blue-500 dark:border-l-blue-400 ring-2 ring-blue-400/30 dark:ring-blue-500/25"
                  : isOverdue
                    ? "border-slate-300 dark:border-[#1e3050] hover:bg-red-50/40 dark:hover:bg-red-950/15 border-l-[3px] border-l-red-500 dark:border-l-rose-500 shadow-sm"
                    : "border-slate-300 dark:border-[#1e3050] hover:bg-slate-50 dark:hover:bg-[#131d30] shadow-sm"
              } ${isExpanded ? "rounded-b-none" : ""} ${
                dragTaskId === task.id ? "opacity-50" : ""
              } ${
                dragOverTaskId === task.id && dragTaskId !== task.id
                  ? "border-t-2 border-t-blue-500"
                  : ""
              }`}
            >
              {/* Drag handle (desktop) / Move buttons (mobile) */}
              <div className="flex-shrink-0 flex flex-col items-center gap-0.5 mt-0.5">
                {/* Desktop: drag handle */}
                <div className="hidden sm:block cursor-grab active:cursor-grabbing text-slate-400 dark:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M7 2a2 2 0 10.001 4.001A2 2 0 007 2zm0 6a2 2 0 10.001 4.001A2 2 0 007 8zm0 6a2 2 0 10.001 4.001A2 2 0 007 14zm6-8a2 2 0 10-.001-4.001A2 2 0 0013 6zm0 2a2 2 0 10.001 4.001A2 2 0 0013 8zm0 6a2 2 0 10.001 4.001A2 2 0 0013 14z" />
                  </svg>
                </div>
                {/* Mobile: up/down buttons */}
                {pendingTasks.length > 1 && (
                  <div className="sm:hidden flex flex-col -my-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); moveTask(task.id, "up"); }}
                      disabled={pendingTasks[0]?.id === task.id}
                      className="p-0.5 text-slate-400 dark:text-slate-400 hover:text-slate-600 disabled:opacity-0 transition-all"
                      aria-label="Move up"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); moveTask(task.id, "down"); }}
                      disabled={pendingTasks[pendingTasks.length - 1]?.id === task.id}
                      className="p-0.5 text-slate-400 dark:text-slate-400 hover:text-slate-600 disabled:opacity-0 transition-all"
                      aria-label="Move down"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              {/* Checkbox */}
              <button
                onClick={(e) => { e.stopPropagation(); toggleComplete(task.id); }}
                className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 mt-0.5 rounded-md border-2 border-slate-300 dark:border-slate-500 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all active:animate-check-bounce flex items-center justify-center"
                aria-label={`Mark "${task.title}" complete`}
              />

              {/* Task content */}
              <div className="flex-1 min-w-0">
                <div
                  className="flex flex-wrap items-center gap-x-2 gap-y-1 text-base font-medium text-slate-800 dark:text-slate-50 break-words leading-normal"
                >
                  {isExpanded && editingId === task.id ? (
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={() => saveEdit(task.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit(task.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full px-1 py-0.5 text-base font-medium border border-blue-300 rounded-lg bg-white dark:bg-[#131d30] dark:text-white outline-none"
                      autoFocus
                    />
                  ) : isExpanded ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); startEditing(task); }}
                      className="text-left px-1 py-0.5 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-[#243350] hover:bg-white dark:hover:bg-[#131d30] transition-colors"
                      title="Click to edit title"
                    >
                      {task.title}
                    </button>
                  ) : (
                    <>{task.title}</>
                  )}
                  {activeTaskId === task.id && isTimerRunning && (
                    <span className="sm:hidden ml-1.5 inline-flex items-center w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse align-middle" />
                  )}
                  {/* Priority badge */}
                  {task.priority && (
                    <span className={`inline-flex items-center px-2 py-0.5 text-xs sm:text-sm font-semibold uppercase rounded ${
                      task.priority === 1 
                        ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-900/50"
                        : task.priority === 2
                          ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-900/50"
                          : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50"
                    }`}>
                      {task.priority === 1 ? "HIGH" : task.priority === 2 ? "MED" : "LOW"}
                    </span>
                  )}
                  {(isAllProjects || isTimeFilter) && (
                    <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md bg-slate-100 dark:bg-[#1a2d4a] text-slate-600 dark:text-slate-300">
                      {getProjectName(task.projectId)}
                    </span>
                  )}
                </div>
                {!isExpanded && <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1.5">
                  {/* Due date — always visible when set */}
                  {task.dueDate && (
                    <div
                      className={`relative inline-flex items-center gap-1.5 px-2 py-1 text-sm font-medium rounded-md transition-colors ${
                        !task.completed && isDueDateOverdue(task.dueDate)
                          ? "text-red-500 dark:text-rose-300 hover:bg-red-50 dark:hover:bg-red-950/30"
                          : !task.completed && task.dueDate === getToday()
                            ? "text-orange-500 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                            : "text-slate-500 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-[#1a2d4a]"
                      }`}
                      title={`Due: ${formatDueDate(task.dueDate)}`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDueDate(task.dueDate)}
                      {!task.completed && isDueDateOverdue(task.dueDate) && " (overdue)"}
                      <input
                        type="date"
                        value={task.dueDate}
                        onChange={(e) => setDueDate(task.id, e.target.value || undefined)}
                        onFocus={(e) => { try { (e.target as HTMLInputElement).showPicker(); } catch {} }}
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                      />
                    </div>
                  )}
                  {(hasSubtasks || task.description || task.sessions > 0 || (task.timeSpent || 0) > 0) && (
                    <span className="text-xs text-slate-400 dark:text-slate-300">·</span>
                  )}
                  {task.description && (
                    <span className="text-xs text-slate-500 dark:text-slate-300 flex items-center gap-0.5" title="Has description">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h14" />
                      </svg>
                    </span>
                  )}
                  {task.description && (hasSubtasks || task.sessions > 0 || (task.timeSpent || 0) > 0) && (
                    <span className="text-xs text-slate-400 dark:text-slate-300">·</span>
                  )}
                  {hasSubtasks && (
                    <span className="app-text-meta text-slate-500 dark:text-slate-300">
                      {completedSubtasks}/{subtasks.length} subtask{subtasks.length !== 1 ? "s" : ""}
                    </span>
                  )}
                  {hasSubtasks && (task.sessions > 0 || (task.timeSpent || 0) > 0) && (
                    <span className="text-xs text-slate-400 dark:text-slate-400">·</span>
                  )}
                  {(task.sessions > 0 || (task.timeSpent || 0) > 0) && (
                    <span className="app-text-meta text-slate-500 dark:text-slate-300">
                      {task.sessions > 0 && (
                        <>{task.sessions} total session{task.sessions !== 1 ? "s" : ""}</>
                      )}
                      {task.sessions > 0 && (task.timeSpent || 0) > 0 && " · "}
                      {(task.timeSpent || 0) > 0 && formatDuration(task.timeSpent)}
                    </span>
                  )}
                  {task.recurrence && (
                    <>
                      <span className="text-xs text-slate-400 dark:text-slate-300">·</span>
                      <span className="text-xs text-slate-500 dark:text-slate-300 flex items-center gap-0.5" title={`Repeats ${task.recurrence}`}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        {task.recurrence}
                      </span>
                    </>
                  )}
                </div>}
              </div>

              {/* Expand chevron indicator */}
              <div
                className={`flex-shrink-0 min-w-[28px] sm:min-w-[36px] min-h-[28px] sm:min-h-[36px] rounded-md flex items-center justify-center ${
                  isExpanded
                    ? "text-blue-500 dark:text-blue-400"
                    : "text-slate-300 dark:text-slate-500"
                }`}
                title={isExpanded ? "Collapse" : "Expand"}
              >
                <svg className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>

              {activeTaskId === task.id && !isTimerRunning && (
                <span className="lg:hidden flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700/50">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                  Timer
                </span>
              )}

              {/* Start / Select / In-progress button — hidden on mobile */}
              {activeTaskId === task.id && isTimerRunning ? (
                <span className="flex-shrink-0 px-2 py-1 text-xs sm:text-sm font-medium rounded bg-blue-600 text-white hidden sm:flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span className="hidden sm:inline">In progress</span>
                </span>
              ) : activeTaskId === task.id ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTask(null);
                    }}
                    className="flex-shrink-0 hidden sm:flex px-2.5 py-1.5 text-xs sm:text-sm font-medium rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 touch-target-sm"
                    title="Deselect task"
                  >
                    Deselect
                  </button>
              ) : !isOverdue ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartTask(task.id);
                    }}
                    className="flex-shrink-0 flex items-center justify-center px-2.5 py-1.5 text-xs sm:text-sm font-semibold rounded text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700/50 bg-blue-50 dark:bg-blue-900/25 hover:bg-blue-100 dark:hover:bg-blue-900/40 touch-target-sm"
                    title={
                      isTimerRunning
                        ? "Switch focus to this task"
                        : "Focus on this task and start the timer"
                    }
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                      <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.84z" />
                    </svg>
                    <span className="ml-1">{isTimerRunning ? "Switch" : "Focus"}</span>
                  </button>
              ) : null}

              {/* Delete — visible on hover (desktop), hidden on mobile to save space */}
              {!(isTimerRunning && activeTaskId === task.id) && (
                <button
                  onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                  className="flex-shrink-0 p-2 rounded-md text-slate-400 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hidden sm:flex hover-reveal-desktop transition-all"
                  aria-label={`Delete "${task.title}"`}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>

            {isOverdue && !task.completed && (
              <div
                className="flex flex-wrap items-center gap-1.5 mt-1.5 mb-0.5 px-1 sm:px-2"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => snoozeToToday(task.id)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-md bg-white dark:bg-[#1a2d4a] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#243350] hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                >
                  Move to today
                </button>
                <button
                  type="button"
                  onClick={() => toggleComplete(task.id)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-50 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                >
                  Done
                </button>
                <button
                  type="button"
                  onClick={() => onStartTask(task.id)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                >
                  Focus
                </button>
              </div>
            )}

            {/* Task detail panel */}
            {isExpanded && (
              <div onClick={(e) => e.stopPropagation()} className={`border border-t-0 rounded-b-xl py-3 space-y-2 ${
                activeTaskId === task.id
                  ? "border-blue-300 dark:border-blue-600 bg-blue-50/50 dark:bg-blue-900/10"
                  : "border-slate-200 dark:border-[#1e3050] bg-slate-50/50 dark:bg-[#131d30]/50"
              }`}>
                {/* Description */}
                <div className="px-4 pb-2">
                  {editingDescId === task.id ? (
                    <textarea
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      onBlur={() => saveDesc(task.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") setEditingDescId(null);
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) saveDesc(task.id);
                      }}
                      placeholder="Add a description..."
                      maxLength={2000}
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-blue-300 rounded-lg bg-white dark:bg-[#131d30] dark:text-white outline-none resize-y"
                      autoFocus
                    />
                  ) : (
                    <button
                      onClick={() => startEditingDesc(task)}
                      className="w-full text-left px-3 py-2 text-sm rounded-lg border border-dashed border-slate-200 dark:border-[#243350] hover:border-blue-300 dark:hover:border-blue-600 hover:bg-slate-50 dark:hover:bg-[#1a2d4a] transition-colors"
                    >
                      {task.description ? (
                        <span className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{task.description}</span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-400">Add a description...</span>
                      )}
                    </button>
                  )}
                </div>
                {/* Task metadata — due date, recurrence, project */}
                <div className="px-4 pb-2 flex flex-wrap items-center gap-2">
                  {/* Due date */}
                  <div
                    className={`relative inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md border transition-colors ${
                      task.dueDate && !task.completed && isDueDateOverdue(task.dueDate)
                        ? "border-red-200 dark:border-red-800 text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20"
                        : task.dueDate && task.dueDate === getToday()
                          ? "border-orange-200 dark:border-orange-800 text-orange-500 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20"
                          : task.dueDate
                            ? "border-slate-200 dark:border-[#243350] text-slate-600 dark:text-slate-300 bg-white dark:bg-[#131d30]"
                            : "border-dashed border-slate-200 dark:border-[#243350] text-slate-400 dark:text-slate-400 hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-500"
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {task.dueDate ? (
                      <>
                        {formatDueDate(task.dueDate)}
                        {!task.completed && isDueDateOverdue(task.dueDate) && " (overdue)"}
                      </>
                    ) : (
                      "Set due date"
                    )}
                    <input
                      type="date"
                      value={task.dueDate ?? ""}
                      onChange={(e) => setDueDate(task.id, e.target.value || undefined)}
                      onFocus={(e) => { try { (e.target as HTMLInputElement).showPicker(); } catch {} }}
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                    />
                  </div>
                  {/* Priority */}
                  <div className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-[#243350] bg-white dark:bg-[#131d30]">
                    <svg className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                    </svg>
                    <select
                      value={task.priority ?? ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        setTasks(prev => {
                          const updated = prev.map(t =>
                            t.id === task.id
                              ? { ...t, priority: value ? parseInt(value) as TaskPriority : undefined }
                              : t
                          );
                          persist(updated);
                          return updated;
                        });
                      }}
                      className="text-xs bg-transparent dark:text-white outline-none cursor-pointer"
                    >
                      <option value="">No priority</option>
                      <option value="1">🔴 High</option>
                      <option value="2">🟡 Medium</option>
                      <option value="3">🔵 Low</option>
                    </select>
                  </div>
                  {/* Recurrence */}
                  <div className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-[#243350] bg-white dark:bg-[#131d30]">
                    <svg className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <select
                      value={task.recurrence ?? ""}
                      onChange={(e) => setTaskRecurrence(task.id, (e.target.value || undefined) as RecurrenceType | undefined)}
                      className="text-xs bg-transparent dark:text-white outline-none cursor-pointer"
                    >
                      <option value="">No repeat</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  {/* Move to project */}
                  {activeProjects.length > 1 && (
                    <div className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-[#243350] bg-white dark:bg-[#131d30]">
                      <svg className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                      <select
                        value={task.projectId}
                        onChange={(e) => moveTaskToProject(task.id, e.target.value)}
                        className="text-xs bg-transparent dark:text-white outline-none cursor-pointer"
                      >
                        {activeProjects.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Subtasks section */}
                {(hasSubtasks || true) && (
                  <div className="border-t border-slate-100 dark:border-[#1e3050] pt-2 mt-1">
                    {hasSubtasks && (
                      <div className="px-4 pb-1">
                        <span className="text-xs font-medium text-slate-400 dark:text-slate-400 uppercase tracking-wide">Subtasks ({completedSubtasks}/{subtasks.length})</span>
                      </div>
                    )}
                {/* Existing subtasks */}
                {subtasks.map((sub) => (
                  <div key={sub.id} className="group/sub flex items-center gap-2.5 py-1 pl-6 pr-4 ml-4 border-l-2 border-slate-200 dark:border-[#243350]">
                    <button
                      onClick={() => toggleSubtask(task.id, sub.id)}
                      className={`flex-shrink-0 w-5 h-5 rounded border-[1.5px] transition-colors flex items-center justify-center ${
                        sub.completed
                          ? "border-green-400 bg-green-500"
                          : "border-slate-300 dark:border-slate-600 hover:border-blue-500"
                      }`}
                    >
                      {sub.completed && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    {editingSubtaskId === sub.id ? (
                      <input
                        type="text"
                        value={editSubtaskTitle}
                        onChange={(e) => setEditSubtaskTitle(e.target.value)}
                        onBlur={() => saveSubtaskEdit(task.id, sub.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveSubtaskEdit(task.id, sub.id);
                          if (e.key === "Escape") setEditingSubtaskId(null);
                        }}
                        className="flex-1 px-1 py-0.5 text-sm border border-blue-300 rounded bg-white dark:bg-[#131d30] dark:text-white outline-none"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                    <span className={`flex-1 text-sm cursor-pointer ${
                      sub.completed
                        ? "text-slate-400 dark:text-slate-400 line-through"
                        : "text-slate-700 dark:text-slate-200"
                    }`}
                      onDoubleClick={() => startEditingSubtask(sub)}
                      onClick={() => startEditingSubtask(sub)}
                    >
                      {sub.title}
                    </span>
                    )}
                    <div
                      className={`relative flex-shrink-0 p-1 transition-colors ${
                        sub.dueDate && !sub.completed && isDueDateOverdue(sub.dueDate)
                          ? "text-red-500 dark:text-red-400"
                          : sub.dueDate
                            ? "text-slate-500 dark:text-slate-400"
                            : "text-slate-400 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 opacity-100 sm:opacity-0 sm:group-hover/sub:opacity-100"
                      }`}
                      title={sub.dueDate ? `Due: ${formatDueDate(sub.dueDate)}` : "Set due date"}
                    >
                      {sub.dueDate ? (
                        <span className="text-xs font-medium">{formatDueDate(sub.dueDate)}</span>
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )}
                      <input
                        type="date"
                        value={sub.dueDate ?? ""}
                        onChange={(e) => setSubtaskDueDate(task.id, sub.id, e.target.value || undefined)}
                        onFocus={(e) => { try { (e.target as HTMLInputElement).showPicker(); } catch {} }}
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                      />
                    </div>
                    <button
                      onClick={() => deleteSubtask(task.id, sub.id)}
                      className="flex-shrink-0 p-1 text-slate-400 dark:text-slate-400 hover:text-red-500 opacity-100 sm:opacity-0 sm:group-hover/sub:opacity-100 transition-all"
                      aria-label={`Delete subtask "${sub.title}"`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}

                {/* Add subtask input */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    addSubtask(task.id);
                  }}
                  className="flex items-center gap-2 pl-6 pr-4 ml-4 border-l-2 border-slate-200 dark:border-[#243350] pt-1"
                >
                  <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    placeholder="Add a subtask..."
                    className="flex-1 px-2 py-1 text-sm border border-slate-200 dark:border-[#243350] rounded-md bg-white dark:bg-[#131d30] dark:text-white focus:border-blue-400 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!newSubtaskTitle.trim()}
                    className="px-2 py-1 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Add
                  </button>
                </form>
                  </div>
                )}

                {/* Mobile-only action buttons (start & delete) */}
                <div className="sm:hidden flex items-center gap-2 px-4 pt-2 pb-1 border-t border-slate-100 dark:border-[#243350] mt-2">
                  {activeTaskId === task.id && isTimerRunning ? (
                    <span className="px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 text-white flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      In progress
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        if (activeTaskId === task.id) {
                          onSelectTask(null);
                        } else {
                          onStartTask(task.id);
                        }
                      }}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                        activeTaskId === task.id
                          ? "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {activeTaskId === task.id ? (
                        "Deselect"
                      ) : (
                        <>
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.84z" />
                          </svg>
                          {isTimerRunning ? "Switch" : "Focus"}
                        </>
                      )}
                    </button>
                  )}
                  {!(isTimerRunning && activeTaskId === task.id) && (
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="px-3 py-1.5 text-xs font-medium rounded-md text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-1.5"
                      aria-label={`Delete "${task.title}"`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  )}
                </div>
              </div>
            )}
            </div>
            );
          })}
        </div>

        {/* Completed tasks */}
        {completedTasks.length > 0 && (
          <div className="pt-2 border-t border-slate-100 dark:border-[#1e3050]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wide">
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
                  className="text-sm text-slate-400 hover:text-red-500 transition-colors"
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
              className="flex items-center gap-1.5 text-sm font-medium text-slate-400 dark:text-slate-400 uppercase tracking-wide hover:text-slate-600 dark:hover:text-slate-200 transition-colors w-full"
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
                      className="ml-auto flex-shrink-0 text-xs text-slate-400 hover:text-blue-500 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
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
