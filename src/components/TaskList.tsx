"use client";

import React, { useState, useEffect, useLayoutEffect, useCallback, useRef, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Task, Project, Settings, DEFAULT_SETTINGS, DEFAULT_PROJECT, DEFAULT_PROJECT_ID, ALL_PROJECTS_ID, TODAY_FILTER_ID, THIS_WEEK_FILTER_ID, THIS_MONTH_FILTER_ID, THIS_YEAR_FILTER_ID, Subtask, RecurrenceType, TaskPriority, TaskKind } from "@/lib/types";
import { loadTasks, saveTasks, saveTask as saveOneTask, loadProjects, saveProjects, saveSelectedProjectId, deleteTask as removeTaskFromDB, deleteTasks as removeTasksFromDB, deleteProject as removeProjectFromDB, loadSettings, getSharedProjects, loadSharedProjectTasks, subscribeSharedProjectTasks, updateSharedTask, leaveProject, leaveSharedAccount, SharedProject, isSharedProjectFn, loadTaskViewPreferences, saveTaskViewPreferences, loadOneThing, saveOneThing, loadCustomQuote, saveCustomQuote, readLocalWorkspaceSnapshot, type LocalWorkspaceSnapshot } from "@/lib/storage";
import { OPEN_SHARED_PROJECT_EVENT } from "@/components/CollaborationInvitesButton";
import { VIEW_DUE_TASKS_EVENT } from "@/components/DueRemindersButton";
import { trackTaskAdded, trackTaskCompleted, trackTaskDeleted, trackSharedProjectOpened } from "@/lib/analytics";
import { markFirstTaskCompleted } from "@/lib/first-win";
import ConfirmModal from "@/components/ConfirmModal";
import ShareProjectModal from "@/components/ShareProjectModal";
import { PROJECT_TEMPLATES, templateToTasks, type ProjectTemplate } from "@/lib/templates";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/ToastProvider";
import { getToday, formatDateLocal } from "@/lib/dates";
import {
  CLEAR_GUEST_DEMO_EVENT,
  createGuestDemoWorkspace,
  emptyGuestWorkspace,
  extraGuestDemoTasks,
  guestDemoMissingExtraProjects,
  guestHasCustomProjects,
  hasClearedGuestDemo,
  isGuestGeneralDemo,
  isGuestSampleWorkspace,
  isSparseGuestDemo,
  markGuestDemoCleared,
  mergeGuestDemoProjects,
  pickGuestDemoExpandedSubtasksTask,
  pickGuestDemoOneThingTask,
  upgradePlacesToBucketList,
  spreadGuestDemoFeatures,
} from "@/lib/guest-demo";
import {
  doneTodayToastMessage,
  getDoneTodayTasks,
  getEarlierCompletedTasks,
  isDoneToday,
  markDayRecapSeen,
  shouldShowDayRecap,
  summarizeDoneProgress,
  summarizeDoneToday,
} from "@/lib/done-today";
import TaskPanelMenu from "@/components/TaskPanelMenu";
import { printCurrentView } from "@/lib/print-tasks";
import DayRecap from "@/components/DayRecap";
import { FocusBarTitle, FocusBarActions } from "@/components/AppFocusBar";
import { FOCUS_BAR_ICON_BTN } from "@/components/FocusStripControls";

import SmartPlan from "@/components/SmartPlan";
import TaskCalendarView from "@/components/task-list/TaskCalendarView";
import type { TaskListProps, TaskViewMode } from "@/components/task-list/types";
import {
  DEFAULT_VIEW_CHANGED_EVENT,
  resolveInitialTaskView,
  type DefaultTaskView,
} from "@/lib/task-view-preference";
import {
  buildAppHref,
  parseTaskViewFromPath,
} from "@/lib/task-view-url";
import TaskBucketView from "@/components/task-list/TaskBucketView";
import TaskCardView from "@/components/task-list/TaskCardView";
import { applyBucketDrop, moveCardTaskInProject, type BucketDropTarget } from "@/components/task-list/bucket-order";
import { TaskDetailPanel } from "@/components/task-list/TaskDetailPanel";
import { TaskSubtaskSection } from "@/components/task-list/TaskSubtaskSection";
import { TaskExpansionDrawer } from "@/components/task-list/TaskExpansionDrawer";
import { dismissDatePicker } from "@/components/task-list/dismiss-overlays";
import { DueDateField } from "@/components/task-list/DueDateField";
import ProjectManageView from "@/components/task-list/ProjectManageView";
import { ProjectTemplatePicker } from "@/components/task-list/ProjectTemplatePicker";
import OpenTaskList from "@/components/task-list/OpenTaskList";
import { DoneTodaySection } from "@/components/task-list/DoneTodaySection";
import { DoneTodayTally } from "@/components/task-list/DoneTodayTally";
import { BusyBeaver } from "@/components/BusyBeaver";
import { FociDot } from "@/components/FociDot";
import { TimeFilterBanner } from "@/components/task-list/TimeFilterBanner";
import { TaskUrgencySummary } from "@/components/task-list/TaskUrgencySummary";
import { AddProjectButton } from "@/components/task-list/AddProjectButton";
import { ListToolbarProjectMenu } from "@/components/task-list/ListToolbarProjectMenu";
import { MobileTaskToolbar } from "@/components/task-list/MobileTaskToolbar";
import {
  MAX_TASK_TITLE,
  MAX_PROJECT_NAME,
  MAX_VISIBLE_PROJECT_TABS,
  formatDuration,
  formatDueDate,
  isDueDateOverdue,
  getNextDueDate,
  projectTabTooltip,
  projectTabLabel,
  sortProjectsForDisplay,
  reorderProjects,
  reorderSubtasks,
  moveProjectInDisplayOrder,
  resolveProjectColor,
  pickProjectColor,
  filterTasksByQuery,
} from "@/components/task-list/utils";
import { OneThingCard } from "@/components/task-list/OneThingCard";
import {
  canBeOneThing,
  resolveOneThing,
  type OneThingPreference,
} from "@/lib/one-thing";
import { getTaskListSection, getTaskListSectionOrder, isActionableOverdue } from "@/lib/task-status";
import { ProjectTabName } from "@/components/task-list/ProjectTabName";
import { TaskSearchField } from "@/components/task-list/TaskSearchField";
import {
  ProjectEditMenu,
  ProjectNameInput,
  canRenameProject,
  useProjectEditMenu,
} from "@/components/task-list/ProjectEditMenu";
import { CUSTOM_QUOTE_CHANGED_EVENT, getDisplayQuote, notifyCustomQuoteChanged } from "@/lib/quotes";

const VIEW_RETURN_LABELS: Record<string, string> = {
  card: "Cards",
  bucket: "Buckets",
  list: "List",
  calendar: "Calendar",
  plan: "Plan",
};

const VIEW_PRINT_LABELS: Record<TaskViewMode, string> = {
  card: "Cards",
  bucket: "Buckets",
  list: "List",
  calendar: "Calendar",
  plan: "Smart Plan",
};

/** Selected layout segment — outline chip (`.btn-chip-active`), not a filled CTA. */
const FILTER_TAB_ACTIVE = "btn-chip-active";
const FILTER_TAB_INACTIVE =
  "border border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/70 dark:hover:bg-white/[0.06]";

/** Selected project scope — outline chip, same recipe as layout tabs. */
const PROJECT_TAB_ACTIVE = "btn-chip-active";
const PROJECT_TAB_INACTIVE = "btn-chip";

/** Pill radius = track radius − padding so the active segment nests cleanly. */
const SEG_TAB_PAD = "px-2.5 py-1 min-h-[1.75rem] rounded text-sm font-medium transition-colors";
const SEG_TAB_ICON_PAD = `inline-flex items-center gap-1.5 ${SEG_TAB_PAD} whitespace-nowrap`;

export default function TaskList({
  activeTaskId,
  onSelectTask,
  onStartTask,
  onCompleteTask,
  isTimerRunning,
  isFullscreen,
  onToggleFullscreen,
  focusMode,
  onOpenSettings,
}: TaskListProps) {
  // Hydration-safe: never read localStorage in useState initializers (SSR ≠ client).
  // Snapshot paints in useLayoutEffect before the browser paints.
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [bootSnapshot, setBootSnapshot] = useState<LocalWorkspaceSnapshot | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [tasksReady, setTasksReady] = useState(false);
  const [syncingFromServer, setSyncingFromServer] = useState(false);
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
  const [cardJumpProjectId, setCardJumpProjectId] = useState("");
  const [cardJumpToken, setCardJumpToken] = useState(0);
  const [highlightProjectId, setHighlightProjectId] = useState<string | null>(null);
  const [forceVisibleProjectIds, setForceVisibleProjectIds] = useState<Set<string>>(() => new Set());
  const [autoQuickAddProjectId, setAutoQuickAddProjectId] = useState<string | null>(null);
  const [showCardReorderTip, setShowCardReorderTip] = useState(false);
  const [showOverflowProjectMenu, setShowOverflowProjectMenu] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editProjectName, setEditProjectName] = useState("");
  const [editingProjectDescId, setEditingProjectDescId] = useState<string | null>(null);
  const [editProjectDesc, setEditProjectDesc] = useState("");
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  /** Inline subtasks under a row (card/bucket/list) — separate from the Details pane. */
  const [expandedSubtasksTaskId, setExpandedSubtasksTaskId] = useState<string | null>(null);
  const guestDemoShowcaseAppliedRef = useRef(false);
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
  // Prefer URL layout on first paint so remounts don't flash Cards.
  const [viewMode, setViewMode] = useState<TaskViewMode>(
    () => parseTaskViewFromPath(pathname) ?? "card",
  );
  const [preparingPrint, setPreparingPrint] = useState(false);
  const [oneThingPref, setOneThingPref] = useState<OneThingPreference | null>(null);
  const [oneThingPromptDismissed, setOneThingPromptDismissed] = useState(false);
  const [customQuote, setCustomQuote] = useState<string | null>(null);
  const displayQuote = getDisplayQuote(customQuote);

  useEffect(() => {
    const refreshQuote = () => {
      loadCustomQuote()
        .then((q) => setCustomQuote(q))
        .catch((err) => console.error("[Foci] Failed to load custom quote:", err));
    };
    refreshQuote();
    window.addEventListener(CUSTOM_QUOTE_CHANGED_EVENT, refreshQuote);
    return () => window.removeEventListener(CUSTOM_QUOTE_CHANGED_EVENT, refreshQuote);
  }, []);

  // Instant paint from last local snapshot — after hydrate, before browser paint.
  useLayoutEffect(() => {
    const snap = readLocalWorkspaceSnapshot();
    const pathView = parseTaskViewFromPath(window.location.pathname);
    if (pathView) {
      setViewMode(pathView);
    }
    if (!snap) return;
    setBootSnapshot(snap);
    setTasks(snap.tasks);
    setProjects(snap.projects);
    if (!pathView) {
      setViewMode(resolveInitialTaskView(snap.taskViewPrefs));
    }
    setOneThingPref(snap.oneThing);
    setTasksReady(true);
  }, []);

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
      ...(explicit ? { defaultTaskView: mode, taskViewExplicit: true } : { taskViewExplicit: false }),
    }).catch((err) => console.error("[Foci] Failed to save task view preference:", err));
  }, []);

  const persistOneThing = useCallback((pref: OneThingPreference | null) => {
    setOneThingPref(pref);
    if (pref) setOneThingPromptDismissed(false);
    saveOneThing(pref).catch((err) => console.error("[Foci] Failed to save One Thing:", err));
  }, []);

  /** Guest sample: One Thing is a leaf task; a different task starts with subtasks open. */
  useEffect(() => {
    if (guestDemoShowcaseAppliedRef.current) return;
    if (authLoading || !tasksReady || user || hasClearedGuestDemo()) return;
    if (!isGuestSampleWorkspace(tasks, projects)) return;

    const leaf = pickGuestDemoOneThingTask(tasks);
    const withSubs = pickGuestDemoExpandedSubtasksTask(tasks);
    if (!leaf && !withSubs) return;

    guestDemoShowcaseAppliedRef.current = true;
    if (withSubs) setExpandedSubtasksTaskId(withSubs.id);

    const current = oneThingPref
      ? tasks.find((t) => t.id === oneThingPref.taskId)
      : undefined;
    const oneThingOnSubtasks = !!(current && (current.subtasks?.length ?? 0) > 0);
    if (leaf && (!oneThingPref || oneThingOnSubtasks)) {
      persistOneThing({ taskId: leaf.id, date: getToday() });
    }
  }, [authLoading, tasksReady, user, tasks, projects, oneThingPref, persistOneThing]);

  const setAsOneThing = useCallback(
    (taskId: string) => {
      const source = tasks.find((t) => t.id === taskId);
      if (!source || !canBeOneThing(source)) {
        showToast("Pick an open, actionable task", "info");
        return;
      }
      persistOneThing({ taskId, date: getToday() });
      showToast("Set as today’s One Thing", "success");
    },
    [tasks, persistOneThing, showToast],
  );

  const clearOneThingPick = useCallback(() => {
    persistOneThing(null);
  }, [persistOneThing]);

  const changeOneThingPick = useCallback(() => {
    persistOneThing(null);
    setOneThingPromptDismissed(false);
    showToast("Pick another task as your One Thing", "info");
  }, [persistOneThing, showToast]);

  const viewBeforePlanRef = useRef<TaskViewMode>("card");
  const viewBeforeManageRef = useRef<TaskViewMode>("card");
  const drillReturnViewRef = useRef<TaskViewMode>("card");
  const wasProjectDrillInRef = useRef(false);
  const taskDetailPushedRef = useRef(false);
  /** User picked a layout this session — don't let async prefs load clobber it (e.g. Plan → Cards). */
  const viewModeUserChosenRef = useRef(false);
  /** Layout we’re navigating to — ignore stale pathname until the URL catches up (prevents tab flicker). */
  const pendingViewModeRef = useRef<TaskViewMode | null>(null);
  /** True while our own router.replace for a layout tab is in flight — never mirror path→state then. */
  const ownLayoutNavRef = useRef(false);

  const appHref = useCallback(
    (mutate: (params: URLSearchParams) => void, mode?: TaskViewMode | null) => {
      const pathMode = mode === undefined ? parseTaskViewFromPath(pathname) ?? viewMode : mode;
      return buildAppHref(pathMode, searchParams, mutate);
    },
    [pathname, viewMode, searchParams],
  );

  const openProjectManage = useCallback(() => {
    // Prefer returning to cards/buckets/calendar over a list drill-in.
    const fromParam = searchParams.get("from");
    const fromView =
      fromParam === "bucket" || fromParam === "calendar" || fromParam === "card" || fromParam === "plan"
        ? fromParam
        : null;
    const preferReturn =
      fromView ??
      drillReturnViewRef.current ??
      (viewMode === "calendar" || viewMode === "list" || viewMode === "bucket" || viewMode === "card"
        ? viewMode
        : "card");
    viewBeforeManageRef.current = preferReturn === "list" ? "card" : preferReturn;
    if (searchParams.get("projects") === "1") {
      setProjectManageOpen(true);
      return;
    }
    // Push so browser Back closes Projects. Clear drill-in params so we don't
    // stack ?project=&from=&projects=1 (3-dot was navigating without a menu).
    router.push(
      appHref((p) => {
        p.delete("project");
        p.delete("from");
        p.delete("task");
        p.set("projects", "1");
      }),
      { scroll: false },
    );
  }, [viewMode, searchParams, router, appHref]);

  const closeProjectManage = useCallback(() => {
    setEditingProjectId(null);
    if (searchParams.get("projects") === "1") {
      router.replace(appHref((p) => p.delete("projects")), { scroll: false });
    } else {
      setProjectManageOpen(false);
    }
  }, [searchParams, router, appHref]);

  const backFromProjectsManage = useCallback(() => {
    setEditingProjectId(null);
    if (searchParams.get("projects") === "1") {
      router.back();
      return;
    }
    setProjectManageOpen(false);
  }, [searchParams, router]);

  const [listReturnView, setListReturnView] = useState<TaskViewMode | null>(null);
  const [showDayRecap, setShowDayRecap] = useState(false);
  const [tallyPulse, setTallyPulse] = useState(false);

  const selectViewMode = useCallback((mode: TaskViewMode) => {
    viewModeUserChosenRef.current = true;
    pendingViewModeRef.current = mode;
    ownLayoutNavRef.current = true;
    wasProjectDrillInRef.current = false;
    taskDetailPushedRef.current = false;

    // Paint the new layout immediately — URL sync must not overwrite until path matches.
    if (mode === "plan") {
      setViewMode((prev) => {
        if (prev !== "plan") {
          viewBeforePlanRef.current =
            prev === "calendar" || prev === "list" || prev === "bucket" || prev === "card"
              ? prev
              : "card";
        }
        return "plan";
      });
      loadSettings().then(setPlanSettings);
    } else {
      setViewMode(mode);
      persistTaskView(mode);
    }
    setListReturnView(null);
    setExpandedTaskId(null);
    setExpandedSubtasksTaskId(null);
    setNewSubtaskTitle("");
    setEditingSubtaskId(null);

    const nextHref = buildAppHref(mode, searchParams, (p) => {
      p.delete("project");
      p.delete("from");
      p.delete("task");
      p.delete("projects");
    });
    const currentHref = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
    if (nextHref !== currentHref) {
      router.replace(nextHref, { scroll: false });
    } else {
      pendingViewModeRef.current = null;
      ownLayoutNavRef.current = false;
    }
  }, [persistTaskView, searchParams, router, pathname]);

  // Default due date when adding from Today / Week / Month / Year views
  useEffect(() => {
    const inTimeScope =
      selectedProjectId === TODAY_FILTER_ID ||
      selectedProjectId === THIS_WEEK_FILTER_ID ||
      selectedProjectId === THIS_MONTH_FILTER_ID ||
      selectedProjectId === THIS_YEAR_FILTER_ID;
    setNewTaskDueDate(inTimeScope ? getToday() : "");
  }, [selectedProjectId]);

  const [hideEmptyCardProjects, setHideEmptyCardProjects] = useState(true);
  const [cardQuery, setCardQuery] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem("foci-hide-empty-cards") === "0") {
      setHideEmptyCardProjects(false);
    }
  }, []);

  const toggleHideEmptyCardProjects = useCallback(() => {
    setHideEmptyCardProjects((hidden) => {
      const next = !hidden;
      if (typeof window !== "undefined") {
        localStorage.setItem("foci-hide-empty-cards", next ? "1" : "0");
      }
      return next;
    });
  }, []);

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

  const goHomeCards = useCallback(() => {
    setEditingProjectId(null);
    setSelectedSharedProject(null);
    setSelectedProjectId(ALL_PROJECTS_ID);
    saveSelectedProjectId(ALL_PROJECTS_ID).catch(() => {});
    setListReturnView(null);
    setExpandedTaskId(null);
    setExpandedSubtasksTaskId(null);
    setNewSubtaskTitle("");
    wasProjectDrillInRef.current = false;
    taskDetailPushedRef.current = false;
    selectViewMode("card");
  }, [selectViewMode]);

  useEffect(() => {
    const open = () => openProjectManage();
    const close = () => closeProjectManage();
    const homeCards = () => goHomeCards();
    window.addEventListener("foci-open-project-menu", open);
    window.addEventListener("foci-close-project-menu", close);
    window.addEventListener("foci-go-home-cards", homeCards);
    return () => {
      window.removeEventListener("foci-open-project-menu", open);
      window.removeEventListener("foci-close-project-menu", close);
      window.removeEventListener("foci-go-home-cards", homeCards);
    };
  }, [openProjectManage, closeProjectManage, goHomeCards]);

  // Sync navigable overlays from the URL so browser Back restores prior UI.
  // Layout mode comes from `/app/cards` (etc). Do not depend on viewMode — that caused
  // Plan clicks to race with drill-in restore and bounce to the previous tab.
  useEffect(() => {
    const shouldOpenProjects = searchParams.get("projects") === "1";
    setProjectManageOpen((wasOpen) => {
      if (wasOpen === shouldOpenProjects) return wasOpen;
      if (shouldOpenProjects) {
        const pathView = parseTaskViewFromPath(pathname);
        viewBeforeManageRef.current =
          pathView && pathView !== "plan"
            ? pathView
            : viewMode === "calendar" || viewMode === "list" || viewMode === "bucket" || viewMode === "card"
              ? viewMode
              : "card";
      }
      return shouldOpenProjects;
    });
    if (!shouldOpenProjects) {
      setEditingProjectId(null);
    }

    const drillProject = searchParams.get("project");
    const fromParam = searchParams.get("from");
    const pathView = parseTaskViewFromPath(pathname);

    if (drillProject) {
      if (
        fromParam === "bucket" ||
        fromParam === "calendar" ||
        fromParam === "card" ||
        fromParam === "plan"
      ) {
        drillReturnViewRef.current = fromParam;
      } else if (!wasProjectDrillInRef.current) {
        drillReturnViewRef.current = pathView && pathView !== "list" ? pathView : "card";
      }
      wasProjectDrillInRef.current = true;
      setSelectedSharedProject(null);
      setSelectedProjectId(drillProject);
      setViewMode("list");
      setListReturnView(drillReturnViewRef.current);
      setShowOverflowProjectMenu(false);
    } else if (wasProjectDrillInRef.current) {
      wasProjectDrillInRef.current = false;
      const returnTo = drillReturnViewRef.current;
      setListReturnView(null);
      setSelectedProjectId(ALL_PROJECTS_ID);
      saveSelectedProjectId(ALL_PROJECTS_ID).catch(() => {});
      // Don't stomp an in-flight layout click (e.g. Plan while leaving a project drill).
      if (pendingViewModeRef.current && pendingViewModeRef.current !== returnTo) {
        /* keep pending view — selectViewMode already painted it */
      } else {
        pendingViewModeRef.current = null;
        ownLayoutNavRef.current = false;
        setViewMode(returnTo);
        if (returnTo === "plan") loadSettings().then(setPlanSettings);
        if (pathView !== returnTo) {
          ownLayoutNavRef.current = true;
          pendingViewModeRef.current = returnTo;
          router.replace(
            buildAppHref(returnTo, searchParams, (p) => {
              p.delete("project");
              p.delete("from");
            }),
            { scroll: false },
          );
        }
      }
    } else if (pathView) {
      // Own tab click: state is already correct — only clear the guard when the URL catches up.
      // Never setViewMode from a stale path (that flashed Cards while opening Plan).
      if (ownLayoutNavRef.current || pendingViewModeRef.current) {
        if (pathView === pendingViewModeRef.current) {
          pendingViewModeRef.current = null;
          ownLayoutNavRef.current = false;
        }
      } else {
        // Browser back/forward or shared link — adopt the path.
        viewModeUserChosenRef.current = true;
        setViewMode((prev) => {
          if (prev === pathView) return prev;
          if (pathView === "plan" && prev !== "plan") {
            viewBeforePlanRef.current =
              prev === "calendar" || prev === "list" || prev === "bucket" || prev === "card"
                ? prev
                : "card";
          }
          return pathView;
        });
        if (pathView === "plan") loadSettings().then(setPlanSettings);
      }
    }

    const taskId = searchParams.get("task");
    if (taskId) {
      setExpandedTaskId((current) => {
        if (current === taskId) return current;
        setNewSubtaskTitle("");
        return taskId;
      });
    } else {
      taskDetailPushedRef.current = false;
      setExpandedTaskId((current) => {
        if (!current) return current;
        setNewSubtaskTitle("");
        return null;
      });
    }
    // viewMode intentionally omitted — URL is the source of truth for layout.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-sync on navigation
  }, [searchParams, pathname, router]);

  useEffect(() => {
    try {
      if (sessionStorage.getItem("foci-go-home-cards") === "1") {
        sessionStorage.removeItem("foci-go-home-cards");
        goHomeCards();
      }
    } catch {
      /* ignore */
    }
  }, [goHomeCards]);

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

  const userId = user?.id;
  useEffect(() => {
    // Wait until auth has resolved so we use the correct adapter (Supabase vs localStorage)
    if (authLoading) return;

    // Load projects (and shared projects for logged-in users)
    const loadData = async () => {
      const paintedFromSnapshot = bootSnapshot != null;
      if (paintedFromSnapshot) setSyncingFromServer(true);
      try {
        const [existingProjects, existing, taskViewPrefs, oneThing] = await Promise.all([
          loadProjects(),
          loadTasks(),
          loadTaskViewPreferences(),
          loadOneThing(),
        ]);
        setProjects(existingProjects);
        const drillingIn =
          typeof window !== "undefined" &&
          new URLSearchParams(window.location.search).get("project");
        const pathView =
          typeof window !== "undefined" ? parseTaskViewFromPath(window.location.pathname) : null;
        if (!drillingIn && !viewModeUserChosenRef.current && !pathView) {
          setViewMode(resolveInitialTaskView(taskViewPrefs));
        }
        setOneThingPref(oneThing);

        // Seed a feature-complete demo for logged-out visitors (and upgrade older sample seeds).
        const demoCleared = hasClearedGuestDemo();
        const snapshotIsSparse = bootSnapshot != null && isSparseGuestDemo(bootSnapshot.tasks);
        const emptyGuest = existing.length === 0 && (!bootSnapshot || snapshotIsSparse);
        const shouldReplaceGuestDemo =
          !demoCleared && !user && (isSparseGuestDemo(existing) || emptyGuest);
        const baseTasks = existing.length > 0 ? existing : (bootSnapshot?.tasks ?? []);
        const shouldAddDemoProjects =
          !demoCleared &&
          !user &&
          !shouldReplaceGuestDemo &&
          !guestHasCustomProjects(existingProjects) &&
          guestDemoMissingExtraProjects(existingProjects) &&
          isGuestGeneralDemo(baseTasks);

        let nextTasks = existing;
        let nextProjects = existingProjects;
        let nextOneThing = oneThing;

        if (shouldReplaceGuestDemo) {
          const demo = createGuestDemoWorkspace();
          nextTasks = demo.tasks;
          nextProjects = demo.projects;
          nextOneThing = demo.oneThing;
          saveTasks(demo.tasks).catch((err) => {
            console.error("[Foci] Failed to save sample tasks:", err);
          });
          saveProjects(demo.projects).catch((err) => {
            console.error("[Foci] Failed to save sample projects:", err);
          });
          persistOneThing(demo.oneThing);
        } else if (shouldAddDemoProjects) {
          const demo = createGuestDemoWorkspace();
          nextProjects = mergeGuestDemoProjects(existingProjects, demo.projects);
          nextTasks = [...baseTasks, ...extraGuestDemoTasks(demo)];
          saveTasks(nextTasks).catch((err) => {
            console.error("[Foci] Failed to save sample tasks:", err);
          });
          saveProjects(nextProjects).catch((err) => {
            console.error("[Foci] Failed to save sample projects:", err);
          });
        } else {
          const bucketUpgrade =
            !demoCleared && !user
              ? upgradePlacesToBucketList(existing, existingProjects)
              : null;
          if (bucketUpgrade) {
            nextTasks = bucketUpgrade.tasks;
            nextProjects = bucketUpgrade.projects;
            saveTasks(bucketUpgrade.tasks).catch((err) => {
              console.error("[Foci] Failed to save sample tasks:", err);
            });
            saveProjects(bucketUpgrade.projects).catch((err) => {
              console.error("[Foci] Failed to save sample projects:", err);
            });
          } else {
            const migrated = existing.map((t) => ({
              ...t,
              projectId: t.projectId || DEFAULT_PROJECT_ID,
            }));
            if (migrated.some((t, i) => t.projectId !== existing[i]?.projectId)) {
              saveTasks(migrated).catch((err) => {
                console.error("[Foci] Failed to save migrated tasks:", err);
              });
            }
            nextTasks = migrated;
          }
        }

        if (!user && !demoCleared) {
          const spread = spreadGuestDemoFeatures(nextTasks);
          if (spread) {
            nextTasks = spread;
            saveTasks(spread).catch((err) => {
              console.error("[Foci] Failed to spread sample features:", err);
            });
          }
        }

        if (!user && !demoCleared && isGuestSampleWorkspace(nextTasks, nextProjects)) {
          const withSubs = pickGuestDemoExpandedSubtasksTask(nextTasks);
          if (withSubs) setExpandedSubtasksTaskId(withSubs.id);
          const leaf = pickGuestDemoOneThingTask(nextTasks);
          const current = nextOneThing
            ? nextTasks.find((t) => t.id === nextOneThing!.taskId)
            : undefined;
          if (leaf && (!nextOneThing || (current && (current.subtasks?.length ?? 0) > 0))) {
            persistOneThing({ taskId: leaf.id, date: getToday() });
          }
        }

        setProjects(nextProjects);
        setTasks(nextTasks);

        // Paint cards immediately — shared projects are not needed for own data.
        setTasksReady(true);

        if (user) {
          getSharedProjects()
            .then(setSharedProjects)
            .catch((err) => {
              console.error("[Foci] Failed to load shared projects:", err);
            });
        }
      } catch (err) {
        console.error("[Foci] Failed to load data:", err);
        setTasksReady(true);
      } finally {
        setSyncingFromServer(false);
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
  const persistOne = useCallback(
    async (updated: Task[], changedTask: Task, revertTo?: Task) => {
      setTasks(updated);
      try {
        await saveOneTask(changedTask);
      } catch (err) {
        console.error("[Foci] Failed to save task:", err);
        if (revertTo) {
          setTasks((curr) => curr.map((t) => (t.id === revertTo.id ? revertTo : t)));
        }
        showToast("Failed to save task. Tap Retry — your edit was reverted.", "error", {
          label: "Retry",
          onClick: () => {
            void persistOne(updated, changedTask, revertTo);
          },
        });
      }
    },
    [showToast],
  );

  const persistProjects = useCallback((updated: Project[]) => {
    setProjects(updated);
    saveProjects(updated).catch((err) => {
      console.error("[Foci] Failed to save projects:", err);
      showToast("Failed to save projects.", "error");
    });
  }, [showToast]);

  const selectProject = (id: string) => {
    setSelectedSharedProject(null);
    setSelectedProjectId(id);
    saveSelectedProjectId(id).catch((err) => {
      console.error("[Foci] Failed to save selected project:", err);
    });
    setShowOverflowProjectMenu(false);
    if (searchParams.get("projects") === "1") {
      router.replace(appHref((p) => p.delete("projects")), { scroll: false });
    } else {
      setProjectManageOpen(false);
      setEditingProjectId(null);
    }

    const drilled = searchParams.get("project");
    if (drilled) {
      const isTimeScope =
        id === TODAY_FILTER_ID ||
        id === THIS_WEEK_FILTER_ID ||
        id === THIS_MONTH_FILTER_ID ||
        id === THIS_YEAR_FILTER_ID;
      if (id === ALL_PROJECTS_ID || isTimeScope) {
        const returnMode = drillReturnViewRef.current;
        wasProjectDrillInRef.current = false;
        setListReturnView(null);
        setViewMode(returnMode);
        router.replace(
          buildAppHref(returnMode, searchParams, (p) => {
            p.delete("project");
            p.delete("from");
          }),
          { scroll: false },
        );
      } else if (id !== drilled) {
        router.replace(appHref((p) => p.set("project", id), "list"), { scroll: false });
      }
    }
  };

  const expandProjectToList = useCallback((projectId: string) => {
    const from: TaskViewMode =
      viewMode === "list"
        ? (listReturnView ?? "card")
        : viewMode === "plan"
          ? "card"
          : viewMode;
    drillReturnViewRef.current = from === "list" ? "card" : from;
    router.push(
      buildAppHref("list", searchParams, (p) => {
        p.delete("projects");
        p.delete("task");
        p.set("project", projectId);
        p.set("from", drillReturnViewRef.current);
      }),
      { scroll: false },
    );
  }, [viewMode, listReturnView, router, searchParams]);

  const reloadAfterImport = useCallback(async (result?: {
    tasks: Task[];
    projects: Project[];
    focusProjectId?: string;
  }) => {
    try {
      if (result?.tasks && result?.projects) {
        setProjects(result.projects);
        setTasks(result.tasks);
      } else {
        const [nextProjects, nextTasks] = await Promise.all([loadProjects(), loadTasks()]);
        setProjects(nextProjects);
        setTasks(nextTasks);
      }
      const focusId = result?.focusProjectId;
      if (focusId && focusId !== ALL_PROJECTS_ID) {
        expandProjectToList(focusId);
      }
      showToast("Import complete", "success");
    } catch (err) {
      console.error("[Foci] Failed to reload after import:", err);
      showToast("Imported, but failed to refresh the list. Reload the page.", "error");
    }
  }, [showToast, expandProjectToList]);

  const backFromProjectList = useCallback(() => {
    if (searchParams.get("project")) {
      router.back();
      return;
    }
    const returnTo = listReturnView ?? "card";
    setSelectedProjectId(ALL_PROJECTS_ID);
    saveSelectedProjectId(ALL_PROJECTS_ID).catch(() => {});
    setListReturnView(null);
    wasProjectDrillInRef.current = false;
    selectViewMode(returnTo);
  }, [listReturnView, searchParams, router, selectViewMode]);

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
    trackSharedProjectOpened({ source: "app" });
    setSelectedSharedProject(shared);
    setSelectedProjectId(`shared:${shared._ownerId}:${shared.id}`);
    closeProjectManage();
    // Shared projects only support list layout for now — don't overwrite default view.
    if (viewMode !== "list") {
      setListReturnView(viewMode);
    }
    setViewMode("list");
    
    // Load tasks for this shared project if not already loaded
    const key = `${shared._ownerId}:${shared.id}`;
    if (!sharedTasks[key]) {
      try {
        const loaded = await loadSharedProjectTasks(shared.id, shared._ownerId);
        setSharedTasks((prev) => ({ ...prev, [key]: loaded }));
      } catch (err) {
        console.error("[Foci] Failed to load shared project tasks:", err);
        showToast("Failed to load shared project tasks", "error");
      }
    }
  };

  const sharedProjectsRef = useRef(sharedProjects);
  sharedProjectsRef.current = sharedProjects;
  const selectSharedProjectRef = useRef(selectSharedProject);
  selectSharedProjectRef.current = selectSharedProject;

  // Open a shared project from the Sharing hub (navbar people icon)
  useEffect(() => {
    const openShared = (e: Event) => {
      const detail = (e as CustomEvent<{ ownerId: string; projectId: string }>).detail;
      if (!detail?.ownerId || !detail?.projectId) return;

      const openFromList = (list: SharedProject[]) => {
        const found = list.find(
          (p) => p._ownerId === detail.ownerId && p.id === detail.projectId,
        );
        if (found) void selectSharedProjectRef.current(found);
      };

      if (sharedProjectsRef.current.length > 0) {
        openFromList(sharedProjectsRef.current);
        return;
      }
      getSharedProjects()
        .then((list) => {
          setSharedProjects(list);
          openFromList(list);
        })
        .catch((err) => console.error("[Foci] Failed to open shared project:", err));
    };

    window.addEventListener(OPEN_SHARED_PROJECT_EVENT, openShared);
    return () => window.removeEventListener(OPEN_SHARED_PROJECT_EVENT, openShared);
  }, []);

  useEffect(() => {
    const clearDemo = () => {
      if (user) return;
      markGuestDemoCleared();
      const empty = emptyGuestWorkspace();
      persistOneThing(null);
      setProjects(empty.projects);
      setTasks(empty.tasks);
      setSelectedSharedProject(null);
      setSelectedProjectId(ALL_PROJECTS_ID);
      saveSelectedProjectId(ALL_PROJECTS_ID).catch(() => {});
      setListReturnView(null);
      void Promise.all([saveProjects(empty.projects), saveTasks(empty.tasks)]).catch((err) => {
        console.error("[Foci] Failed to clear sample workspace:", err);
      });
      showToast("Samples cleared — add your own project", "success");
      openProjectManage();
    };
    window.addEventListener(CLEAR_GUEST_DEMO_EVENT, clearDemo);
    return () => window.removeEventListener(CLEAR_GUEST_DEMO_EVENT, clearDemo);
  }, [user, persistOneThing, openProjectManage, showToast]);

  // Due/overdue tray → Today filter (and optional task detail)
  useEffect(() => {
    const openDue = (e: Event) => {
      const detail = (e as CustomEvent<{ taskId?: string }>).detail;
      selectProject(TODAY_FILTER_ID);
      if (detail?.taskId) {
        setExpandedTaskId(detail.taskId);
      }
    };
    window.addEventListener(VIEW_DUE_TASKS_EVENT, openDue);
    return () => window.removeEventListener(VIEW_DUE_TASKS_EVENT, openDue);
  }, []);

  // Pending due view after navigating to /app from another page
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("foci-pending-due-view");
      if (!raw) return;
      sessionStorage.removeItem("foci-pending-due-view");
      const pending = JSON.parse(raw) as { taskId?: string };
      queueMicrotask(() => {
        window.dispatchEvent(new CustomEvent(VIEW_DUE_TASKS_EVENT, { detail: pending }));
      });
    } catch {
      /* ignore */
    }
  }, []);

  // Live shared project tasks via Realtime; poll only if Realtime fails to subscribe
  useEffect(() => {
    if (!selectedSharedProject || !selectedProjectId.startsWith("shared:")) return;

    const shared = selectedSharedProject;
    const key = `${shared._ownerId}:${shared.id}`;
    let pollId: ReturnType<typeof setInterval> | null = null;
    let usingRealtime = false;

    const refresh = () => {
      loadSharedProjectTasks(shared.id, shared._ownerId)
        .then((loaded) => {
          setSharedTasks((prev) => ({ ...prev, [key]: loaded }));
        })
        .catch((err) => console.error("[Foci] Shared project refresh failed:", err));
    };

    const startPolling = () => {
      if (pollId != null || usingRealtime) return;
      pollId = setInterval(refresh, 30_000);
    };

    const unsub = subscribeSharedProjectTasks(
      shared.id,
      shared._ownerId,
      refresh,
      (status) => {
        if (status === "subscribed") {
          usingRealtime = true;
          if (pollId != null) {
            clearInterval(pollId);
            pollId = null;
          }
        } else {
          usingRealtime = false;
          startPolling();
        }
      },
    );

    // If Realtime never confirms, fall back to polling after a short grace period
    const fallbackTimer = setTimeout(() => {
      if (!usingRealtime) startPolling();
    }, 4_000);

    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearTimeout(fallbackTimer);
      if (pollId != null) clearInterval(pollId);
      document.removeEventListener("visibilitychange", onVisible);
      unsub();
    };
  }, [selectedProjectId, selectedSharedProject]);

  // Pending open after navigating to /app from another page
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("foci-pending-shared-project");
      if (!raw) return;
      sessionStorage.removeItem("foci-pending-shared-project");
      const pending = JSON.parse(raw) as { ownerId: string; projectId: string };
      // Defer so the listener above is registered
      queueMicrotask(() => {
        window.dispatchEvent(
          new CustomEvent(OPEN_SHARED_PROJECT_EVENT, { detail: pending }),
        );
      });
    } catch {
      /* ignore */
    }
  }, []);

  // Remove collaborator access to a shared project (or entire account share)
  const handleLeaveSharedProject = async (shared: SharedProject) => {
    const isAccountShare = shared._shareSource === "account";
    const ownerLabel = shared._ownerName || shared._ownerEmail;
    setPendingConfirm({
      title: isAccountShare ? "Remove account access?" : "Remove your access?",
      message: isAccountShare
        ? `Remove access to all projects from ${ownerLabel}? You won’t see their shared projects anymore.`
        : `Remove your access to “${shared.name}”? You won’t see this project or its tasks anymore.`,
      confirmLabel: "Remove access",
      onConfirm: async () => {
        try {
          if (isAccountShare) {
            await leaveSharedAccount(shared._ownerId);
            setSharedProjects((prev) => prev.filter((p) => p._ownerId !== shared._ownerId || p._shareSource !== "account"));
          } else {
            await leaveProject(shared.id, shared._ownerId);
            setSharedProjects((prev) => prev.filter((p) => !(p.id === shared.id && p._ownerId === shared._ownerId)));
          }
          // Clear selected if it was this shared project (or any from that account)
          if (
            selectedSharedProject &&
            (isAccountShare
              ? selectedSharedProject._ownerId === shared._ownerId
              : selectedSharedProject.id === shared.id && selectedSharedProject._ownerId === shared._ownerId)
          ) {
            setSelectedSharedProject(null);
            setSelectedProjectId(TODAY_FILTER_ID);
          }
          showToast(isAccountShare ? "Account access removed" : "Access removed", "success");
        } catch (err) {
          const message = err instanceof Error ? err.message : "Couldn’t remove access";
          showToast(message, "error");
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
  const canEditSharedProject = selectedSharedProject?._myRole === "editor";

  const assertCanEditShared = (): boolean => {
    if (!isViewingSharedProject || !selectedSharedProject) return true;
    if (canEditSharedProject) return true;
    showToast("You have view-only access to this project", "info");
    return false;
  };

  /** Apply a task mutation to either own tasks or the open shared project. */
  const mutateActiveTask = (taskId: string, map: (task: Task) => Task) => {
    if (isViewingSharedProject && selectedSharedProject) {
      if (!assertCanEditShared()) return;
      const task = currentSharedProjectTasks.find((t) => t.id === taskId);
      if (!task) return;
      void updateTaskInSharedProject(map(task), selectedSharedProject._ownerId);
      return;
    }
    const previous = tasks.find((t) => t.id === taskId);
    const updated = tasks.map((t) => (t.id === taskId ? map(t) : t));
    const changed = updated.find((t) => t.id === taskId);
    if (changed) persistOne(updated, changed, previous);
  };
  const addProject = (template?: ProjectTemplate) => {
    const name = (template?.label ?? newProjectName).trim().slice(0, MAX_PROJECT_NAME);
    if (!name) return;
    const nextColor = pickProjectColor(projects);
    const orders = projects.map((p) => p.order ?? 0);
    const minOrder = orders.length > 0 ? Math.min(...orders) : 0;
    const project: Project = {
      id: crypto.randomUUID(),
      name,
      color: nextColor,
      order: minOrder - 1,
      createdAt: Date.now(),
      ...(template?.description ? { description: template.description } : {}),
    };
    persistProjects([...projects, project]);
    if (template) {
      const newTasks = templateToTasks(template, project.id);
      void persist([...tasks, ...newTasks]);
      showToast(`Created ${name} with ${newTasks.length} tasks`, "success");
    } else {
      showToast(`Created ${name} — add your first task`, "success");
    }
    setNewProjectName("");
    setForceVisibleProjectIds((prev) => {
      const next = new Set(prev);
      next.add(project.id);
      return next;
    });
    closeProjectManage();
    setSelectedSharedProject(null);
    setSelectedProjectId(ALL_PROJECTS_ID);
    saveSelectedProjectId(ALL_PROJECTS_ID).catch(() => {});
    setListReturnView(null);
    selectViewMode("card");
    setCardJumpProjectId(project.id);
    setCardJumpToken((n) => n + 1);
    setHighlightProjectId(project.id);
    setAutoQuickAddProjectId(project.id);
    window.setTimeout(() => setAutoQuickAddProjectId(null), 4000);
  };

  const startEditingProject = (p: Project) => {
    setEditingProjectId(p.id);
    setEditProjectName(p.name);
  };

  const cancelEditingProject = () => {
    setEditingProjectId(null);
    setEditProjectName("");
  };

  const saveProjectEdit = () => {
    const name = editProjectName.trim().slice(0, MAX_PROJECT_NAME);
    if (!name || !editingProjectId) {
      cancelEditingProject();
      return;
    }
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

  const projectEdit = {
    editingId: editingProjectId,
    editName: editProjectName,
    onEditNameChange: setEditProjectName,
    onStartRename: startEditingProject,
    onSaveRename: saveProjectEdit,
    onCancelRename: cancelEditingProject,
    onUpdateColor: updateProjectColor,
  };

  const listProjectEditMenu = useProjectEditMenu();
  const listMenu = listProjectEditMenu.menu;
  const listMenuProject = listMenu
    ? projects.find((p) => p.id === listMenu.projectId)
    : undefined;

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
    const taskCount = tasks.filter((t) => t.projectId === id).length;
    setPendingConfirm({
      title: "Delete project",
      message:
        taskCount > 0
          ? `Delete "${project?.name ?? ""}" and its ${taskCount} task${taskCount === 1 ? "" : "s"}? This cannot be undone.`
          : `Delete "${project?.name ?? ""}"? This cannot be undone.`,
      confirmLabel: "Delete",
      onConfirm: async () => {
        setPendingConfirm(null);
        const toRemove = tasks.filter((t) => t.projectId === id).map((t) => t.id);
        persist(tasks.filter((t) => t.projectId !== id));
        persistProjects(projects.filter((p) => p.id !== id));
        setForceVisibleProjectIds((prev) => {
          if (!prev.has(id)) return prev;
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        if (oneThingPref?.taskId && toRemove.includes(oneThingPref.taskId)) clearOneThingPick();
        if (activeTaskId && toRemove.includes(activeTaskId)) onSelectTask(null);
        try {
          if (toRemove.length > 0) await removeTasksFromDB(toRemove);
          await removeProjectFromDB(id);
        } catch (err) {
          console.error("[Foci] Failed to delete project:", err);
          showToast("Failed to delete project.", "error");
        }
        setSelectedSharedProject(null);
        setSelectedProjectId(ALL_PROJECTS_ID);
        saveSelectedProjectId(ALL_PROJECTS_ID).catch(() => {});
        setListReturnView(null);
        setExpandedTaskId(null);
        closeProjectManage();
        selectViewMode("card");
      },
    });
  };

  const addTaskWithTitle = (
    titleRaw: string,
    dueDateOverride?: string,
    projectIdOverride?: string,
    options?: { openDetail?: boolean },
  ) => {
    if (isViewingSharedProject) {
      showToast("You can't add tasks to a shared project", "info");
      return;
    }
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
    if (options?.openDetail !== false) {
      setExpandedTaskId(task.id);
      setNewSubtaskTitle("");
      taskDetailPushedRef.current = true;
      router.push(appHref((p) => p.set("task", task.id)), { scroll: false });
    }
  };

  const addTask = () => addTaskWithTitle(newTaskTitle, undefined, newTaskProjectId);

  const toggleComplete = (id: string) => {
    const sourceTasks = isViewingSharedProject ? currentSharedProjectTasks : tasks;
    const task = sourceTasks.find((t) => t.id === id);
    if (!task) return;
    if (!assertCanEditShared()) return;

    const isCompleting = !task.completed;
    // If completing the active task, stop timer and save elapsed time
    let elapsed = 0;
    if (isCompleting && activeTaskId === id) {
      elapsed = onCompleteTask(id);
    }
    const now = Date.now();
    let updated = sourceTasks.map((t) => {
      if (t.id !== id) return t;
      if (isCompleting) {
        return {
          ...t,
          completed: true,
          completedAt: now,
          timeSpent: (t.timeSpent || 0) + elapsed,
        };
      }
      return {
        ...t,
        completed: false,
        completedAt: undefined,
        timeSpent: (t.timeSpent || 0) + elapsed,
      };
    });
    const changed = updated.find((t) => t.id === id)!;

    if (isViewingSharedProject && selectedSharedProject) {
      // Shared editors can update but not insert recurring follow-ups.
      void updateTaskInSharedProject(changed, selectedSharedProject._ownerId);
      if (isCompleting) {
        trackTaskCompleted(changed.timeSpent || 0);
        markFirstTaskCompleted();
        showToast(
          task.recurrence
            ? `${doneTodayToastMessage(updated.filter((t) => isDoneToday(t)).length)} · next occurrence isn’t created in shared projects`
            : doneTodayToastMessage(updated.filter((t) => isDoneToday(t)).length),
          "success",
        );
        setTallyPulse(true);
        window.setTimeout(() => setTallyPulse(false), 900);
      }
      if (activeTaskId === id) onSelectTask(null);
      return;
    }

    if (isCompleting) {
      trackTaskCompleted((changed.timeSpent || 0));
      markFirstTaskCompleted();
      const snapshot = tasks;
      const doneTodayCount = updated.filter((t) => isDoneToday(t)).length;
      showToast(
        doneTodayToastMessage(doneTodayCount, { recurring: !!task.recurrence }),
        "success",
        {
          label: "Undo",
          onClick: () => persist(snapshot),
        }
      );
      setTallyPulse(true);
      window.setTimeout(() => setTallyPulse(false), 900);
      if (shouldShowDayRecap(doneTodayCount)) {
        markDayRecapSeen();
        setShowDayRecap(true);
      }
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
          ...(task.priority != null ? { priority: task.priority } : {}),
          ...(task.kind ? { kind: task.kind } : {}),
        };
        updated = [...updated, nextTask];
        persist(updated, changed);
        saveOneTask(nextTask).catch((err) => console.error("[Foci] Failed to save recurring task:", err));
      } else {
        persistOne(updated, changed, task);
      }
    } else {
      persistOne(updated, changed, task);
    }
    if (activeTaskId === id) onSelectTask(null);
  };

  const deleteTask = async (id: string) => {
    if (isViewingSharedProject) {
      showToast("You can't delete tasks in a shared project", "info");
      return;
    }
    const task = tasks.find((t) => t.id === id);
    setPendingConfirm({
      title: "Delete task",
      message: `Delete "${task?.title ?? "this task"}"? This cannot be undone.`,
      confirmLabel: "Delete",
      onConfirm: async () => {
        setPendingConfirm(null);
        trackTaskDeleted();
        persist(tasks.filter((t) => t.id !== id));
        if (oneThingPref?.taskId === id) clearOneThingPick();
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
    if (isViewingSharedProject && selectedSharedProject) {
      if (!assertCanEditShared()) return;
      const task = currentSharedProjectTasks.find((t) => t.id === id);
      if (!task) return;
      void updateTaskInSharedProject({ ...task, dueDate: date }, selectedSharedProject._ownerId);
      return;
    }
    const previous = tasks.find((t) => t.id === id);
    const updated = tasks.map((t) => (t.id === id ? { ...t, dueDate: date } : t));
    const changed = updated.find((t) => t.id === id)!;
    persistOne(updated, changed, previous);
  };

  const snoozeToToday = (id: string) => {
    setDueDate(id, getToday());
    showToast("Moved to today", "success");
  };

  const startEditing = (task: Task, titleOverride?: string) => {
    setEditingId(task.id);
    setEditTitle(titleOverride ?? task.title);
  };

  const saveEdit = (id: string) => {
    const title = editTitle.trim().slice(0, MAX_TASK_TITLE);
    if (!title) return;
    if (isViewingSharedProject && selectedSharedProject) {
      if (!assertCanEditShared()) return;
      const task = currentSharedProjectTasks.find((t) => t.id === id);
      if (!task) return;
      void updateTaskInSharedProject({ ...task, title }, selectedSharedProject._ownerId);
      setEditingId(null);
      return;
    }
    const previous = tasks.find((t) => t.id === id);
    const updated = tasks.map((t) =>
      t.id === id ? { ...t, title } : t
    );
    const changed = updated.find((t) => t.id === id)!;
    persistOne(updated, changed, previous);
    setEditingId(null);
  };

  const clearCompleted = async () => {
    const matchesProject = (t: Task) => isAllProjects || t.projectId === selectedProjectId;
    const toRemove = tasks.filter((t) => t.completed && matchesProject(t)).map((t) => t.id);
    persist(tasks.filter((t) => !(t.completed && matchesProject(t))));
    if (oneThingPref?.taskId && toRemove.includes(oneThingPref.taskId)) clearOneThingPick();
    try {
      await removeTasksFromDB(toRemove);
    } catch (err) {
      console.error("[Foci] Failed to clear completed tasks:", err);
    }
  };

  const archiveCompleted = () => {
    const now = Date.now();
    const matchesProject = (t: Task) => isAllProjects || t.projectId === selectedProjectId;
    const archivedIds = tasks
      .filter((t) => t.completed && matchesProject(t) && !t.archivedAt)
      .map((t) => t.id);
    const updated = tasks.map((t) =>
      t.completed && matchesProject(t) && !t.archivedAt
        ? { ...t, archivedAt: now }
        : t
    );
    persist(updated);
    if (oneThingPref?.taskId && archivedIds.includes(oneThingPref.taskId)) clearOneThingPick();
  };

  const unarchiveTask = (id: string) => {
    const previous = tasks.find((t) => t.id === id);
    const updated = tasks.map((t) =>
      t.id === id ? { ...t, archivedAt: undefined } : t
    );
    const changed = updated.find((t) => t.id === id)!;
    persistOne(updated, changed, previous);
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

  // Subtask helpers
  const addSubtask = (taskId: string) => {
    const title = newSubtaskTitle.trim().slice(0, MAX_TASK_TITLE);
    if (!title) return;
    const subtask: Subtask = { id: crypto.randomUUID(), title, completed: false };
    mutateActiveTask(taskId, (t) => ({ ...t, subtasks: [...(t.subtasks || []), subtask] }));
    setNewSubtaskTitle("");
    setExpandedTaskId(taskId);
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    mutateActiveTask(taskId, (t) => ({
      ...t,
      subtasks: (t.subtasks || []).map((s) =>
        s.id === subtaskId ? { ...s, completed: !s.completed } : s
      ),
    }));
  };

  const deleteSubtask = (taskId: string, subtaskId: string) => {
    mutateActiveTask(taskId, (t) => ({
      ...t,
      subtasks: (t.subtasks || []).filter((s) => s.id !== subtaskId),
    }));
  };

  const startEditingSubtask = (sub: Subtask, titleOverride?: string) => {
    setEditingSubtaskId(sub.id);
    setEditSubtaskTitle(titleOverride ?? sub.title);
  };

  const saveSubtaskEdit = (taskId: string, subtaskId: string) => {
    const title = editSubtaskTitle.trim().slice(0, MAX_TASK_TITLE);
    if (!title) { setEditingSubtaskId(null); return; }
    mutateActiveTask(taskId, (t) => ({
      ...t,
      subtasks: (t.subtasks || []).map((s) =>
        s.id === subtaskId ? { ...s, title } : s
      ),
    }));
    setEditingSubtaskId(null);
  };

  const setSubtaskDueDate = (taskId: string, subtaskId: string, date: string | undefined) => {
    mutateActiveTask(taskId, (t) => ({
      ...t,
      subtasks: (t.subtasks || []).map((s) =>
        s.id === subtaskId ? { ...s, dueDate: date } : s
      ),
    }));
  };

  const reorderTaskSubtasks = (taskId: string, draggedId: string, targetId: string) => {
    mutateActiveTask(taskId, (t) => {
      const next = reorderSubtasks(t.subtasks || [], draggedId, targetId);
      return next ? { ...t, subtasks: next } : t;
    });
  };

  const startEditingDesc = (task: Task) => {
    setEditingDescId(task.id);
    setEditDesc(task.description ?? "");
  };

  const saveDesc = (id: string) => {
    const desc = editDesc.trim();
    mutateActiveTask(id, (t) => ({ ...t, description: desc || undefined }));
    setEditingDescId(null);
  };

  const moveTaskToProject = (taskId: string, newProjectId: string) => {
    if (isViewingSharedProject) {
      showToast("You can't move tasks out of a shared project", "info");
      return;
    }
    const previous = tasks.find((t) => t.id === taskId);
    const updated = tasks.map((t) =>
      t.id === taskId ? { ...t, projectId: newProjectId } : t
    );
    const changed = updated.find((t) => t.id === taskId)!;
    persistOne(updated, changed, previous);
  };

  const handleBucketDrop = (draggedTaskId: string, target: BucketDropTarget) => {
    const updated = applyBucketDrop(tasks, draggedTaskId, target, activeTaskId);
    if (!updated) {
      showToast(
        "Drag within the same section to reorder, or drop on another project column to move.",
        "info",
      );
      return;
    }
    persist(updated);
  };

  const setTaskRecurrence = (taskId: string, recurrence: RecurrenceType | undefined) => {
    mutateActiveTask(taskId, (t) => {
      if (!recurrence) return { ...t, recurrence: undefined };
      // Next occurrence is computed from due date; default to today if unset.
      return { ...t, recurrence, dueDate: t.dueDate ?? getToday(), someday: false };
    });
  };

  const setTaskPriority = (taskId: string, priority: TaskPriority | undefined) => {
    mutateActiveTask(taskId, (t) => ({ ...t, priority }));
  };

  const setTaskKind = (taskId: string, kind: TaskKind | undefined) => {
    mutateActiveTask(taskId, (t) => {
      if (!kind || kind === "task") {
        const next = { ...t };
        delete next.kind;
        return next;
      }
      return { ...t, kind };
    });
  };

  const setTaskBlocked = (taskId: string, blocked: boolean) => {
    mutateActiveTask(taskId, (t) => {
      if (blocked) return { ...t, blocked: true, someday: false };
      return { ...t, blocked: false };
    });
    if (blocked) {
      showToast("Marked as waiting", "info");
      if (oneThingPref?.taskId === taskId) clearOneThingPick();
    }
  };

  const setTaskSomeday = (taskId: string, someday: boolean) => {
    mutateActiveTask(taskId, (t) => {
      if (someday) return { ...t, someday: true, blocked: false, dueDate: undefined, recurrence: undefined };
      return { ...t, someday: false };
    });
    if (someday) {
      showToast("Moved to Someday", "success");
      if (oneThingPref?.taskId === taskId) clearOneThingPick();
    }
  };

  const oneThingResolved = useMemo(
    () => resolveOneThing(oneThingPref, tasks),
    [oneThingPref, tasks],
  );

  // Persist clear when stored pick is stale (wrong day / missing / archived)
  useEffect(() => {
    if (!tasksReady || !oneThingPref) return;
    if (oneThingPref.date !== getToday()) {
      persistOneThing(null);
      return;
    }
    const task = tasks.find((t) => t.id === oneThingPref.taskId);
    if (!task || task.archivedAt) {
      persistOneThing(null);
    }
  }, [tasksReady, oneThingPref, tasks, persistOneThing]);

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
    onSetKind: (kind: TaskKind | undefined) => setTaskKind(task.id, kind),
    onSetBlocked: (blocked: boolean) => setTaskBlocked(task.id, blocked),
    onSetSomeday: (someday: boolean) => setTaskSomeday(task.id, someday),
    onSetRecurrence: (recurrence: RecurrenceType | undefined) => setTaskRecurrence(task.id, recurrence),
    onMoveToProject: (projectId: string) => moveTaskToProject(task.id, projectId),
    isOneThing: oneThingResolved.pref?.taskId === task.id && oneThingResolved.status !== "unset",
    canSetOneThing: canBeOneThing(task) && tasks.some((t) => t.id === task.id),
    onSetOneThing: () => setAsOneThing(task.id),
    onClearOneThing: clearOneThingPick,
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
    onReorderSubtasks: (draggedId: string, targetId: string) =>
      reorderTaskSubtasks(task.id, draggedId, targetId),
  });

  const toggleTaskDetail = (taskId: string) => {
    if (expandedTaskId === taskId) {
      closeTaskDetail();
      return;
    }
    setExpandedTaskId(taskId);
    setNewSubtaskTitle("");
    const href = appHref((p) => p.set("task", taskId));
    if (searchParams.get("task")) {
      router.replace(href, { scroll: false });
    } else {
      taskDetailPushedRef.current = true;
      router.push(href, { scroll: false });
    }
  };

  const toggleSubtasksExpanded = (taskId: string) => {
    setExpandedSubtasksTaskId((current) => {
      const next = current === taskId ? null : taskId;
      if (next !== current) setNewSubtaskTitle("");
      return next;
    });
  };

  const closeTaskDetail = () => {
    dismissDatePicker();
    setNewSubtaskTitle("");
    if (searchParams.get("task")) {
      if (taskDetailPushedRef.current) {
        taskDetailPushedRef.current = false;
        router.back();
        return;
      }
      setExpandedTaskId(null);
      router.replace(appHref((p) => { p.delete("task"); }), { scroll: false });
      return;
    }
    setExpandedTaskId(null);
  };

  const saveAndCloseTaskDetail = (taskId: string) => {
    if (isViewingSharedProject && selectedSharedProject) {
      if (!assertCanEditShared()) {
        closeTaskDetail();
        return;
      }
      let next = currentSharedProjectTasks;
      let changed: Task | null = null;

      if (editingId === taskId) {
        const title = editTitle.trim().slice(0, MAX_TASK_TITLE);
        if (title) {
          next = next.map((t) => (t.id === taskId ? { ...t, title } : t));
          changed = next.find((t) => t.id === taskId) ?? null;
        }
        setEditingId(null);
      }

      if (editingDescId === taskId) {
        const desc = editDesc.trim();
        next = next.map((t) =>
          t.id === taskId ? { ...t, description: desc || undefined } : t
        );
        changed = next.find((t) => t.id === taskId) ?? null;
        setEditingDescId(null);
      }

      if (editingSubtaskId) {
        const title = editSubtaskTitle.trim().slice(0, MAX_TASK_TITLE);
        if (title) {
          next = next.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  subtasks: (t.subtasks || []).map((s) =>
                    s.id === editingSubtaskId ? { ...s, title } : s
                  ),
                }
              : t
          );
          changed = next.find((t) => t.id === taskId) ?? null;
        }
        setEditingSubtaskId(null);
      }

      const pendingSub = newSubtaskTitle.trim().slice(0, MAX_TASK_TITLE);
      if (pendingSub) {
        const subtask: Subtask = { id: crypto.randomUUID(), title: pendingSub, completed: false };
        next = next.map((t) =>
          t.id === taskId ? { ...t, subtasks: [...(t.subtasks || []), subtask] } : t
        );
        changed = next.find((t) => t.id === taskId) ?? null;
        setNewSubtaskTitle("");
      }

      if (changed) void updateTaskInSharedProject(changed, selectedSharedProject._ownerId);
      closeTaskDetail();
      return;
    }

    let next = tasks;
    let changed: Task | null = null;
    const previous = tasks.find((t) => t.id === taskId);

    if (editingId === taskId) {
      const title = editTitle.trim().slice(0, MAX_TASK_TITLE);
      if (title) {
        next = next.map((t) => (t.id === taskId ? { ...t, title } : t));
        changed = next.find((t) => t.id === taskId) ?? null;
      }
      setEditingId(null);
    }

    if (editingDescId === taskId) {
      const desc = editDesc.trim();
      next = next.map((t) =>
        t.id === taskId ? { ...t, description: desc || undefined } : t
      );
      changed = next.find((t) => t.id === taskId) ?? null;
      setEditingDescId(null);
    }

    if (editingSubtaskId) {
      const title = editSubtaskTitle.trim().slice(0, MAX_TASK_TITLE);
      if (title) {
        next = next.map((t) =>
          t.id === taskId
            ? {
                ...t,
                subtasks: (t.subtasks || []).map((s) =>
                  s.id === editingSubtaskId ? { ...s, title } : s
                ),
              }
            : t
        );
        changed = next.find((t) => t.id === taskId) ?? null;
      }
      setEditingSubtaskId(null);
    }

    const pendingSub = newSubtaskTitle.trim().slice(0, MAX_TASK_TITLE);
    if (pendingSub) {
      const subtask: Subtask = { id: crypto.randomUUID(), title: pendingSub, completed: false };
      next = next.map((t) =>
        t.id === taskId ? { ...t, subtasks: [...(t.subtasks || []), subtask] } : t
      );
      changed = next.find((t) => t.id === taskId) ?? null;
      setNewSubtaskTitle("");
    }

    if (changed) persistOne(next, changed, previous);
    closeTaskDetail();
  };

  // Filter tasks for the selected project
  const isAllProjects = selectedProjectId === ALL_PROJECTS_ID;
  const activeProjects = projects.filter((p) => !p.archived);
  const archivedProjects = projects.filter((p) => p.archived);
  const sortedProjects = sortProjectsForDisplay(activeProjects);
  const pinnedProjectCount = sortedProjects.filter((p) => p.favorite).length;
  /** Concrete project for list ⋮ menu (drill-in / single-project scope). */
  const listToolbarMenuProject =
    !isAllProjects &&
    selectedProjectId !== TODAY_FILTER_ID &&
    selectedProjectId !== THIS_WEEK_FILTER_ID &&
    selectedProjectId !== THIS_MONTH_FILTER_ID &&
    selectedProjectId !== THIS_YEAR_FILTER_ID &&
    !selectedProjectId.startsWith("shared:")
      ? sortedProjects.find((p) => p.id === selectedProjectId) ?? null
      : null;
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
  const dueExactlyTodayCount = tasks.filter(
    (t) => !t.archivedAt && !t.completed && t.dueDate === today,
  ).length;
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
    : isViewingSharedProject
      ? currentSharedProjectTasks.filter((t) => !t.archivedAt)
      : isAllProjects
        ? tasks.filter((t) => !t.archivedAt)
        : tasks.filter((t) => t.projectId === selectedProjectId && !t.archivedAt);
  const projectTasksUnfiltered =
    isTimeFilter && projectFilterId !== ALL_PROJECTS_ID
      ? timeScopedTasks.filter((t) => t.projectId === projectFilterId)
      : timeScopedTasks;
  const projectTasks = filterTasksByQuery(projectTasksUnfiltered, cardQuery, projects);
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
  const bucketOpenTasks = filterTasksByQuery(
    bucketScopedTasks.filter((t) => !t.completed && !t.archivedAt),
    cardQuery,
    projects,
  );
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
  const timeFilterActiveProject =
    projectFilterId !== ALL_PROJECTS_ID
      ? projects.find((p) => p.id === projectFilterId)
      : undefined;

  // Done today must ignore time filters (those scopes are open-task-only).
  const listCompletedScope = (() => {
    const scoped = (() => {
      if (isViewingSharedProject) {
        return currentSharedProjectTasks.filter((t) => !t.archivedAt);
      }
      const scopeId = isTimeFilter ? projectFilterId : selectedProjectId;
      if (scopeId === ALL_PROJECTS_ID) {
        return tasks.filter((t) => !t.archivedAt);
      }
      return tasks.filter((t) => !t.archivedAt && t.projectId === scopeId);
    })();
    return filterTasksByQuery(scoped, cardQuery, projects);
  })();
  const completedTasks = listCompletedScope.filter((t) => t.completed);
  const doneTodayTasks = getDoneTodayTasks(listCompletedScope);
  const earlierCompletedTasks = getEarlierCompletedTasks(listCompletedScope);
  const archivedTasks = isViewingSharedProject
    ? currentSharedProjectTasks.filter((t) => t.archivedAt)
    : isAllProjects
      ? tasks.filter((t) => t.archivedAt)
      : tasks.filter((t) => t.projectId === selectedProjectId && t.archivedAt);
  const currentProject = isViewingSharedProject
    ? selectedSharedProject ?? undefined
    : projects.find((p) => p.id === selectedProjectId);
  const getProjectName = (projectId: string) =>
    projects.find((p) => p.id === projectId)?.name
    ?? sharedProjects.find((p) => p.id === projectId)?.name
    ?? "General";

  const doneTodayByProject = new Map<string, Task[]>();
  for (const project of sortedProjects) {
    doneTodayByProject.set(
      project.id,
      getDoneTodayTasks(tasks.filter((t) => t.projectId === project.id && !t.archivedAt)),
    );
  }
  const emptyCardProjectCount = sortedProjects.filter(
    (p) =>
      (bucketTasksByProject.get(p.id) ?? []).length === 0 &&
      (doneTodayByProject.get(p.id) ?? []).length === 0 &&
      !forceVisibleProjectIds.has(p.id),
  ).length;
  const globalDoneTodaySummary = summarizeDoneToday(tasks);
  const doneProgress = summarizeDoneProgress(tasks);
  const scrollToDoneToday = useCallback(() => {
    const sections = document.querySelectorAll<HTMLElement>("[data-done-today-section]");
    sections.forEach((section) => {
      const btn = section.querySelector<HTMLButtonElement>("button[aria-expanded='false']");
      btn?.click();
    });
    const el = sections[0];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
  }, []);

  const dismissDayRecap = useCallback(() => {
    setShowDayRecap(false);
  }, []);

  const printSubtitle = useMemo(() => {
    const parts: string[] = [];
    if (isTimeFilter) {
      if (timeScopeDescription) parts.push(timeScopeDescription);
      parts.push(
        projectFilterId !== ALL_PROJECTS_ID
          ? getProjectName(projectFilterId)
          : "All projects",
      );
    } else if (!isAllProjects) {
      parts.push(getProjectName(selectedProjectId));
    } else {
      parts.push("All projects");
    }
    return parts.join(" · ");
  }, [
    isTimeFilter,
    timeScopeDescription,
    projectFilterId,
    isAllProjects,
    selectedProjectId,
    projects,
  ]);

  const printOpenTaskCount = useMemo(() => {
    if (viewMode === "list") return pendingTasks.length;
    if (viewMode === "card" || viewMode === "bucket") {
      return Array.from(bucketTasksByProject.values()).reduce((sum, list) => sum + list.length, 0);
    }
    return tasks.filter((t) => !t.completed && !t.archivedAt).length;
  }, [
    viewMode,
    pendingTasks.length,
    bucketTasksByProject,
    tasks,
  ]);

  const handlePrint = useCallback(() => {
    if (projectManageOpen) return;
    printCurrentView({
      onPrepare: () => {
        closeTaskDetail();
        setEditingId(null);
        setPreparingPrint(true);
      },
      onCleanup: () => setPreparingPrint(false),
    });
  }, [projectManageOpen, closeTaskDetail]);

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
    onReorderSubtasks: (draggedId: string, targetId: string) =>
      reorderTaskSubtasks(task.id, draggedId, targetId),
  });

  const renderTaskExpansionContent = (task: Task, compact = false) => {
    return (
      <TaskDetailPanel
        task={task}
        variant={compact ? "drawer" : "inline"}
        hideSubtasks={false}
        {...taskDetailPanelProps(task)}
        onDeleteTask={() => {
          deleteTask(task.id);
          closeTaskDetail();
        }}
        onStartTask={() => onStartTask(task.id)}
        onDeselectTask={() => onSelectTask(null)}
        onSave={() => saveAndCloseTaskDetail(task.id)}
      />
    );
  };

  /** Inline subtasks under card/bucket rows — toggled by the N/M badge, not Details. */
  const renderGridSubtasks = (task: Task) => {
    if (!(task.subtasks?.length)) return null;
    if (expandedSubtasksTaskId !== task.id) return null;
    // Drawer already shows subtasks — avoid dual controlled inputs fighting the caret.
    if (expandedTaskId === task.id) return null;
    return (
      <TaskSubtaskSection
        {...taskSubtaskSectionProps(task)}
        showAddForm={false}
        compact
      />
    );
  };

  const renderTaskInlineExpansion = (task: Task, compact = false) => {
    if (compact) return null;

    const detailOpen = expandedTaskId === task.id;
    const subtasksOpen = expandedSubtasksTaskId === task.id || detailOpen;
    if (!detailOpen && !subtasksOpen) return null;

    const subtasks = task.subtasks || [];
    const hasSubtasks = subtasks.length > 0;

    return (
      <div className="overflow-hidden">
        {hasSubtasks && subtasksOpen && (
          <TaskSubtaskSection
            {...taskSubtaskSectionProps(task)}
            showAddForm
            compact={compact}
          />
        )}
        {detailOpen && (
          <TaskDetailPanel
            task={task}
            variant="inline"
            hideSubtasks={hasSubtasks}
            {...taskDetailPanelProps(task)}
            onDeleteTask={() => {
              deleteTask(task.id);
              closeTaskDetail();
            }}
            onStartTask={() => onStartTask(task.id)}
            onDeselectTask={() => onSelectTask(null)}
            onSave={() => saveAndCloseTaskDetail(task.id)}
          />
        )}
      </div>
    );
  };

  const renderOpenTasks = (taskList: Task[], options?: { className?: string }) => (
    <OpenTaskList
      tasks={taskList}
      activeTaskId={activeTaskId}
      oneThingTaskId={oneThingResolved.status === "active" ? oneThingResolved.task?.id ?? null : null}
      isTimerRunning={isTimerRunning}
      expandedTaskId={expandedTaskId}
      expandedSubtasksTaskId={expandedSubtasksTaskId}
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
      onToggleSubtasks={toggleSubtasksExpanded}
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
      className={options?.className ?? "space-y-0.5"}
    />
  );

  const showUrgencySummary =
    !focusMode &&
    !projectManageOpen &&
    isAllProjects &&
    !isTimeFilter &&
    (viewMode === "list" || viewMode === "card" || viewMode === "bucket");

  /** Opened a single project from Cards/Buckets/etc. — sticky bar should name the project. */
  const isListDrillIn = !!listReturnView && viewMode === "list";
  const drillInProject =
    isListDrillIn && !isAllProjects && !isTimeFilter
      ? isViewingSharedProject
        ? selectedSharedProject
        : currentProject
      : null;
  const drillInOpenCount = drillInProject
    ? (isViewingSharedProject ? currentSharedProjectTasks : tasks).filter(
        (t) =>
          !t.archivedAt &&
          !t.completed &&
          (isViewingSharedProject || t.projectId === drillInProject.id),
      ).length
    : 0;
  const drillReturnLabel = VIEW_RETURN_LABELS[listReturnView ?? "card"] ?? "Cards";

  const mobileTimeScope = isTimeFilter ? selectedProjectId : ALL_PROJECTS_ID;

  const cardProjectCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const project of sortedProjects) {
      counts.set(project.id, bucketTasksByProject.get(project.id)?.length ?? 0);
    }
    return counts;
  }, [sortedProjects, bucketTasksByProject]);

  useEffect(() => {
    if (viewMode !== "card" || projectManageOpen) return;
    setShowCardReorderTip(localStorage.getItem("foci-card-reorder-tip-dismissed") !== "1");
  }, [viewMode, projectManageOpen]);

  useEffect(() => {
    if (!cardJumpProjectId) return;
    const t = window.setTimeout(() => {
      const el = document.getElementById(`project-card-${cardJumpProjectId}`);
      el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 60);
    return () => window.clearTimeout(t);
  }, [cardJumpProjectId, cardJumpToken]);

  useEffect(() => {
    if (!highlightProjectId) return;
    const t = window.setTimeout(() => setHighlightProjectId(null), 1800);
    return () => window.clearTimeout(t);
  }, [highlightProjectId, cardJumpToken]);

  const dismissCardReorderTip = () => {
    localStorage.setItem("foci-card-reorder-tip-dismissed", "1");
    setShowCardReorderTip(false);
  };

  const handleMobileProjectJump = (projectId: string) => {
    if (viewMode === "bucket") {
      setBucketJumpProjectId(projectId);
      if (projectId) setBucketScrollToken((n) => n + 1);
      return;
    }
    setCardJumpProjectId(projectId);
  };

  return (
    <div className="app-surface rounded-2xl overflow-visible min-w-0">
      {(syncingFromServer || (authLoading && tasksReady)) && (
        <div
          className="no-print flex items-center gap-2 px-4 pt-3 text-xs font-medium text-slate-500 dark:text-slate-400"
          role="status"
          aria-live="polite"
        >
          <span className="inline-block w-3 h-3 border-2 border-slate-300 dark:border-[#243350] border-t-blue-500 rounded-full animate-spin" />
          Updating tasks…
        </div>
      )}
      <div className="print-only print-header panel-pad-x pt-3">
        <h1>Foci — Tasks ({VIEW_PRINT_LABELS[viewMode]})</h1>
        <p>
          {printSubtitle}
          {" · "}
          {printOpenTaskCount} open task{printOpenTaskCount === 1 ? "" : "s"}
          {" · "}
          Printed{" "}
          {new Date().toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Title + actions live in the shared App Focus Bar */}
      <FocusBarTitle>
        <div className="min-w-0 text-slate-700 dark:text-white">
          {projectManageOpen ? (
            <>
              <button
                type="button"
                onClick={backFromProjectsManage}
                className="no-print btn-chip gap-1.5 px-2 py-1 mb-1 text-sm touch-target-sm"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to {VIEW_RETURN_LABELS[viewBeforeManageRef.current] ?? "tasks"}
              </button>
              <h2 className="text-sm sm:text-base font-semibold tracking-tight leading-none">Projects</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                {sortedProjects.length} project{sortedProjects.length === 1 ? "" : "s"}
                {pinnedProjectCount > 0 && (
                  <span className="text-amber-600 dark:text-amber-300">
                    {" "}· {pinnedProjectCount} pinned
                  </span>
                )}
              </p>
            </>
          ) : (
            <>
              <h2 className="text-base sm:text-lg font-semibold tracking-tight flex items-center gap-1.5 min-w-0 text-slate-800 dark:text-white leading-none">
                {drillInProject ? (
                  <>
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-black/10 dark:ring-white/15"
                      style={{ backgroundColor: resolveProjectColor(drillInProject) }}
                      aria-hidden
                    />
                    <span className="truncate min-w-0" title={drillInProject.name}>
                      {drillInProject.name}
                    </span>
                    {isViewingSharedProject && (
                      <span className="shrink-0 text-xs font-medium text-slate-500 dark:text-slate-400 normal-case tracking-normal">
                        · shared
                      </span>
                    )}
                    {drillInOpenCount > 0 && (
                      <span className="shrink-0 text-xs font-medium tabular-nums text-slate-500 dark:text-slate-400 normal-case tracking-normal">
                        · {drillInOpenCount} open
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <svg className="w-[1.125rem] h-[1.125rem] sm:w-5 sm:h-5 flex-shrink-0 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span className="shrink-0">
                      Tasks
                      {viewMode === "plan" && (
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-300 normal-case tracking-normal"> · Smart Plan</span>
                      )}
                    </span>
                  </>
                )}
                {(showUrgencySummary ||
                  (!focusMode && !projectManageOpen && !drillInProject)) && (
                  <span className="no-print inline-flex items-center gap-2.5 ml-3 sm:ml-4 shrink-0 min-w-0">
                    {showUrgencySummary && (
                      <TaskUrgencySummary
                        compact
                        className="shrink-0"
                        overdueCount={overdueTasks.length}
                        dueTodayCount={dueExactlyTodayCount}
                        onViewOverdue={() => selectProject(TODAY_FILTER_ID)}
                        onViewToday={() => selectProject(TODAY_FILTER_ID)}
                      />
                    )}
                    {!focusMode && !projectManageOpen && !drillInProject && (
                      <DoneTodayTally
                        compact
                        count={doneProgress.today}
                        weekCount={doneProgress.week}
                        monthCount={doneProgress.month}
                        idleDays={doneProgress.idleDays}
                        pulse={tallyPulse}
                        onClick={scrollToDoneToday}
                        className="shrink-0"
                      />
                    )}
                  </span>
                )}
              </h2>
            </>
          )}
        </div>
      </FocusBarTitle>

      <FocusBarActions>
        <div className="no-print flex items-center gap-0.5 flex-shrink-0">
          {!projectManageOpen && (
            <button
              type="button"
              onClick={handlePrint}
              className={`no-print hidden roomy:inline-flex ${FOCUS_BAR_ICON_BTN}`}
              title={`Print ${VIEW_PRINT_LABELS[viewMode]} view`}
              aria-label="Print current view"
              data-tour="print-tasks"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
            </button>
          )}
          {onOpenSettings && (
            <TaskPanelMenu
              user={user}
              onOpenSettings={onOpenSettings}
              onToggleFullscreen={onToggleFullscreen}
              isFullscreen={isFullscreen}
              templates={PROJECT_TEMPLATES}
              onSelectTemplate={addProject}
              onPrint={handlePrint}
              printDisabled={projectManageOpen}
            />
          )}
          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className={`no-print hidden roomy:inline-flex ${FOCUS_BAR_ICON_BTN} ${isFullscreen ? "!bg-blue-700 !text-white hover:!bg-blue-800" : ""}`}
              title={isFullscreen ? "Exit expand" : "Expand tasks"}
              aria-label={isFullscreen ? "Exit expand" : "Expand tasks"}
            >
              {isFullscreen ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9L4 4m0 0h4M4 4v4m11-1V3m0 0h-4m4 0v4M4 15v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              )}
            </button>
          )}
        </div>
      </FocusBarActions>

      {/* Card toolbar — When / Layout (title is in App Focus Bar) */}
      {!focusMode && !projectManageOpen && (
      <div className="no-print panel-pad-x py-1.5 roomy:py-2 text-slate-700 dark:text-white rounded-t-2xl border-b border-[color:var(--surface-border)] dark:border-[#243350]/80">
        {!focusMode && !projectManageOpen && (
          <div className="no-print hidden roomy:flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-2 shrink-0 min-w-0" data-tour="time-filters">
              <label htmlFor="desktop-time-scope" className="app-section-label leading-none text-slate-500 dark:text-slate-400 shrink-0">
                When
              </label>
              <select
                id="desktop-time-scope"
                value={mobileTimeScope}
                onChange={(e) => selectProject(e.target.value)}
                className="min-w-0 max-w-[11rem] px-2.5 py-1.5 min-h-[2rem] text-sm font-medium rounded-md border border-slate-200/90 dark:border-[#243350] bg-white dark:bg-[#131d30] text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%236b7280%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.23%207.21a.75.75%200%20011.06.02L10%2011.168l3.71-3.938a.75.75%200%20111.08%201.04l-4.25%204.5a.75.75%200%2001-1.08%200l-4.25-4.5a.75.75%200%2001.02-1.06z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1rem] bg-[right_0.4rem_center] bg-no-repeat pr-7 truncate"
                aria-label="Filter tasks by due date"
                title={
                  isTodayFilter && overdueTasks.length > 0
                    ? `${overdueTasks.length} overdue · ${dueExactlyTodayCount} due today`
                    : "Filter by due date"
                }
              >
                <option value={ALL_PROJECTS_ID}>All times</option>
                <option value={TODAY_FILTER_ID}>Today</option>
                <option value={THIS_WEEK_FILTER_ID}>This week</option>
                <option value={THIS_MONTH_FILTER_ID}>This month</option>
                <option value={THIS_YEAR_FILTER_ID}>This year</option>
              </select>
              {isTimeFilter && (
                <button
                  type="button"
                  onClick={() => selectProject(ALL_PROJECTS_ID)}
                  className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-md text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1a2d4a] transition-colors"
                  aria-label="Clear time filter — show all times"
                  title="Clear filter"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <div className="flex-1 min-w-0 flex justify-center px-1">
              <TaskSearchField
                value={cardQuery}
                onChange={setCardQuery}
                className="w-full max-w-md"
              />
            </div>

            <div className="flex items-center justify-end gap-2 shrink-0 min-w-0" data-tour="view-modes">
              <span className="app-section-label leading-none self-center text-slate-500 dark:text-slate-400 shrink-0">
                Layout
              </span>
              <div className="app-seg-track flex items-center gap-0" role="group" aria-label="Layout">
                <button
                  onClick={() => selectViewMode("card")}
                  className={`${SEG_TAB_ICON_PAD} ${viewMode === "card" ? FILTER_TAB_ACTIVE : FILTER_TAB_INACTIVE}`}
                  title="Card view — top tasks per project"
                  aria-label="Card view"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  </svg>
                  <span className="hidden lg:inline">Cards</span>
                </button>
                <button
                  onClick={() => selectViewMode("bucket")}
                  className={`${SEG_TAB_ICON_PAD} ${viewMode === "bucket" ? FILTER_TAB_ACTIVE : FILTER_TAB_INACTIVE}`}
                  title="Bucket view — all projects"
                  aria-label="Bucket view"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v18M5 3h4a1 1 0 011 1v16a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1zm10 0h4a1 1 0 011 1v16a1 1 0 01-1 1h-4a1 1 0 01-1-1V4a1 1 0 011-1z" />
                  </svg>
                  <span className="hidden lg:inline">Buckets</span>
                </button>
                <button
                  onClick={() => selectViewMode("list")}
                  className={`${SEG_TAB_ICON_PAD} ${viewMode === "list" ? FILTER_TAB_ACTIVE : FILTER_TAB_INACTIVE}`}
                  title="List view"
                  aria-label="List view"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  <span className="hidden lg:inline">List</span>
                </button>
                <button
                  onClick={() => selectViewMode("calendar")}
                  className={`${SEG_TAB_ICON_PAD} ${viewMode === "calendar" ? FILTER_TAB_ACTIVE : FILTER_TAB_INACTIVE}`}
                  title="Calendar view"
                  aria-label="Calendar view"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="hidden lg:inline">Calendar</span>
                </button>
                <button
                  onClick={() => selectViewMode("plan")}
                  className={`${SEG_TAB_ICON_PAD} ${viewMode === "plan" ? FILTER_TAB_ACTIVE : FILTER_TAB_INACTIVE}`}
                  title="Smart Plan — schedule tasks across projects"
                  aria-label="Smart Plan"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  <span className="hidden lg:inline">Plan</span>
                </button>
              </div>
              <AddProjectButton onClick={openProjectManage} size="sm" />
            </div>
          </div>
        )}

        {/* Mobile toolbar — layout first, when second */}
        {!focusMode && !projectManageOpen && (
        <MobileTaskToolbar
          selectedScope={mobileTimeScope}
          onSelectScope={selectProject}
          viewMode={viewMode}
          onSelectViewMode={selectViewMode}
          onManageProjects={openProjectManage}
          onAddProject={openProjectManage}
          projects={sortedProjects}
          projectJumpId={bucketJumpProjectId}
          onProjectJump={handleMobileProjectJump}
          projectCounts={cardProjectCounts}
          showProjectJump={viewMode === "bucket"}
          onClearTimeFilter={() => selectProject(ALL_PROJECTS_ID)}
          cardQuery={cardQuery}
          onCardQueryChange={setCardQuery}
          showCardSearch
        />
        )}

        <div className="roomy:hidden land-compact:hidden mt-1.5">
          <TaskSearchField value={cardQuery} onChange={setCardQuery} size="compact" />
        </div>

        {!focusMode && !projectManageOpen && viewMode === "card" && showCardReorderTip && sortedProjects.length >= 2 && (
          <p className="no-print roomy:hidden land-compact:hidden mt-1 text-xs text-slate-500 dark:text-slate-400 leading-none flex items-center gap-2">
            <span className="flex-1 truncate">Drag tasks to reorder · ▲▼ moves projects</span>
            <button
              type="button"
              onClick={dismissCardReorderTip}
              className="shrink-0 font-semibold text-blue-600 dark:text-blue-400"
            >
              Got it
            </button>
          </p>
        )}

      </div>
      )}

      {/* Time scope + One Thing — shared strip under When/Layout on every layout */}
      {!projectManageOpen && isTimeFilter && timeScopeDescription && (
        <div className="no-print">
        <TimeFilterBanner
          description={timeScopeDescription}
          datedCount={scopedDatedOpenCount}
          undatedCount={scopedUndatedOpenCount}
          overdueCount={overdueTasks.length}
          projectName={
            viewMode === "list" && projectFilterId !== ALL_PROJECTS_ID
              ? timeFilterActiveProject?.name
              : undefined
          }
          onClear={() => selectProject(ALL_PROJECTS_ID)}
        />
        </div>
      )}

      {!projectManageOpen && viewMode !== "plan" && tasksReady && (
        (oneThingResolved.status !== "unset" || !oneThingPromptDismissed) && (
          <OneThingCard
            status={oneThingResolved.status}
            task={oneThingResolved.task}
            projectName={
              oneThingResolved.task
                ? projects.find((p) => p.id === oneThingResolved.task!.projectId)?.name
                : undefined
            }
            hasOpenTasks={allOpenCount > 0}
            isTimerRunning={isTimerRunning}
            isFocused={!!oneThingResolved.task && activeTaskId === oneThingResolved.task.id}
            quote={displayQuote || null}
            isCustomQuote={!!customQuote?.trim()}
            onSaveQuote={(next) => {
              void saveCustomQuote(next)
                .then(() => {
                  setCustomQuote(next);
                  notifyCustomQuoteChanged();
                })
                .catch((err) => console.error("[Foci] Failed to save custom quote:", err));
            }}
            onFocus={() => {
              if (oneThingResolved.task) onStartTask(oneThingResolved.task.id);
            }}
            onComplete={() => {
              if (oneThingResolved.task) toggleComplete(oneThingResolved.task.id);
            }}
            onChange={changeOneThingPick}
            onClear={clearOneThingPick}
            onDismissEmpty={
              oneThingResolved.status === "unset"
                ? () => setOneThingPromptDismissed(true)
                : undefined
            }
          />
        )
      )}

      {projectManageOpen && (
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
            expandProjectToList(id);
          }}
          onUpdateColor={updateProjectColor}
          onUpdateDueDate={updateProjectDueDate}
          onStartRename={startEditingProject}
          onSaveRename={saveProjectEdit}
          onCancelRename={cancelEditingProject}
          onShare={setShareModalProject}
          onArchive={toggleProjectArchived}
          onDelete={deleteProject}
          onUnarchive={toggleProjectArchived}
          onSelectSharedProject={(sp) => {
            closeProjectManage();
            selectViewMode(viewBeforeManageRef.current);
            selectSharedProject(sp);
          }}
          onLeaveShared={handleLeaveSharedProject}
          onAddProject={addProject}
          onTasksImported={reloadAfterImport}
          renderOpenTasks={renderOpenTasks}
        />
      )}

      {/* Smart Plan view */}
      {!projectManageOpen && viewMode === "plan" && (
        <SmartPlan
          tasks={filterTasksByQuery(tasks, cardQuery, projects)}
          projects={projects}
          settings={planSettings}
          onStartTask={onStartTask}
          onSetOneThing={setAsOneThing}
          oneThingTaskId={oneThingResolved.status === "active" ? oneThingResolved.task?.id ?? null : null}
        />
      )}

      {/* Calendar view */}
      {!projectManageOpen && viewMode === "calendar" && (
        <TaskCalendarView
          tasks={filterTasksByQuery(tasks, cardQuery, projects)}
          projects={projects}
          calendarDate={calendarDate}
          setCalendarDate={setCalendarDate}
          onSetDueDate={setDueDate}
          activeTaskId={activeTaskId}
          onStartTask={onStartTask}
          isTimerRunning={isTimerRunning}
          selectedDay={calendarSelectedDay}
          onSelectDay={setCalendarSelectedDay}
          onQuickAdd={(title, dueDate) => addTaskWithTitle(title, dueDate, undefined, { openDetail: false })}
          expandedTaskId={preparingPrint ? null : expandedTaskId}
          onToggleTaskDetail={toggleTaskDetail}
          expandedSubtasksTaskId={preparingPrint ? null : expandedSubtasksTaskId}
          onToggleSubtasks={toggleSubtasksExpanded}
          renderBelowTask={preparingPrint ? () => null : renderTaskInlineExpansion}
          editingId={editingId}
          editTitle={editTitle}
          onStartEdit={startEditing}
          onEditTitleChange={setEditTitle}
          onSaveEdit={saveEdit}
          onCancelEdit={() => setEditingId(null)}
        />
      )}

      {/* Bucket toolbar — desktop only (mobile uses MobileTaskToolbar) */}
      {!projectManageOpen && viewMode === "bucket" && (
        <div className="no-print hidden roomy:flex panel-pad-x py-2.5 flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-[color:var(--surface-border)] dark:border-[#243350]/80 bg-[var(--surface-muted)]/70 dark:bg-[#0d1526]/50">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0">
            <span className="hidden lg:inline app-text-meta text-slate-400 dark:text-slate-500">
              Drag to reorder · pin columns · manage in Projects (nav or ⋯)
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
                  className="max-w-[11rem] sm:max-w-[14rem] px-3 py-1.5 text-sm font-medium rounded-lg bg-white dark:bg-[#131d30] text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-[#243350] outline-none focus:border-blue-400 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%236b7280%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.23%207.21a.75.75%200%20011.06.02L10%2011.168l3.71-3.938a.75.75%200%20111.08%201.04l-4.25%204.5a.75.75%200%2001-1.08%200l-4.25-4.5a.75.75%200%2001.02-1.06z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.5rem_center] bg-no-repeat pr-8 truncate"
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
          </div>
        </div>
      )}

      {/* Bucket view — all projects as columns */}
      {!projectManageOpen && viewMode === "bucket" && !tasksReady && (
        <div className="panel-pad-x pb-4 pt-1 flex gap-3 overflow-hidden">
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
      {!projectManageOpen && viewMode === "bucket" && tasksReady && (
        <TaskBucketView
          projects={sortedProjects}
          tasksByProject={bucketTasksByProject}
          completedCountByProject={bucketCompletedCountByProject}
          doneTodayByProject={doneTodayByProject}
          activeTaskId={activeTaskId}
          oneThingTaskId={oneThingResolved.status === "active" ? oneThingResolved.task?.id ?? null : null}
          isTimerRunning={isTimerRunning}
          datedLaneLabel={bucketDatedLaneLabel}
          onToggleComplete={toggleComplete}
          onStartTask={onStartTask}
          onSelectTask={onSelectTask}
          onQuickAdd={(title, projectId) => addTaskWithTitle(title, undefined, projectId, { openDetail: false })}
          onToggleProjectFavorite={toggleProjectFavorite}
          onExpandProject={expandProjectToList}
          // Drawer owns title edit — don't mount row autoFocus input (steals caret).
          editingTaskId={
            expandedTaskId != null && editingId === expandedTaskId ? null : editingId
          }
          editTitle={editTitle}
          onStartEdit={startEditing}
          onEditTitleChange={setEditTitle}
          onSaveEdit={saveEdit}
          onCancelEdit={() => setEditingId(null)}
          onSetDueDate={setDueDate}
          expandedTaskId={preparingPrint ? null : expandedTaskId}
          expandedSubtasksTaskId={preparingPrint ? null : expandedSubtasksTaskId}
          onToggleTaskDetail={toggleTaskDetail}
          onToggleSubtasks={toggleSubtasksExpanded}
          onBucketDrop={handleBucketDrop}
          scrollToProjectId={bucketJumpProjectId || null}
          scrollToProjectToken={bucketScrollToken}
          renderBelowTask={preparingPrint ? () => null : renderGridSubtasks}
          projectEdit={projectEdit}
        />
      )}

      {!projectManageOpen && viewMode === "card" && !tasksReady && (
        <div className="panel-pad-x pb-4 pt-1 grid grid-cols-1 min-[480px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
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
      {!projectManageOpen && viewMode === "card" && tasksReady && (
        <TaskCardView
          projects={sortedProjects}
          tasksByProject={bucketTasksByProject}
          completedCountByProject={bucketCompletedCountByProject}
          doneTodayByProject={doneTodayByProject}
          activeTaskId={activeTaskId}
          oneThingTaskId={oneThingResolved.status === "active" ? oneThingResolved.task?.id ?? null : null}
          isTimerRunning={isTimerRunning}
          expandedTaskId={preparingPrint ? null : expandedTaskId}
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
          // Drawer owns title edit — don't mount row autoFocus input (steals caret).
          editingTaskId={
            expandedTaskId != null && editingId === expandedTaskId ? null : editingId
          }
          editTitle={editTitle}
          onStartEdit={startEditing}
          onEditTitleChange={setEditTitle}
          onSaveEdit={saveEdit}
          onCancelEdit={() => setEditingId(null)}
          onDeleteTask={deleteTask}
          onMoveProject={handleMoveProject}
          onExpandProject={expandProjectToList}
          onOpenProject={expandProjectToList}
          onToggleProjectFavorite={toggleProjectFavorite}
          onQuickAdd={(title, projectId) => addTaskWithTitle(title, undefined, projectId, { openDetail: false })}
          onToggleComplete={toggleComplete}
          onToggleTaskDetail={toggleTaskDetail}
          onToggleSubtasks={toggleSubtasksExpanded}
          expandedSubtasksTaskId={preparingPrint ? null : expandedSubtasksTaskId}
          renderBelowTask={preparingPrint ? () => null : renderGridSubtasks}
          hideEmptyProjects={hideEmptyCardProjects}
          onToggleHideEmptyProjects={toggleHideEmptyCardProjects}
          emptyProjectCount={emptyCardProjectCount}
          overdueCount={overdueTasks.length}
          onViewOverdue={() => selectProject(TODAY_FILTER_ID)}
          suppressOverdueBanner={showUrgencySummary}
          highlightProjectId={highlightProjectId}
          forceVisibleProjectIds={forceVisibleProjectIds}
          autoQuickAddProjectId={autoQuickAddProjectId}
          cardQuery={cardQuery}
          onCardQueryChange={setCardQuery}
          onAddProject={openProjectManage}
          projectEdit={projectEdit}
        />
      )}

      {/* Project filter — works with Today/Week/Month/Year via projectFilterId */}
      {!projectManageOpen && viewMode === "list" && isViewingSharedProject && selectedSharedProject && (
        <div className="panel-pad-x pt-2 pb-2 border-b border-[color:var(--surface-border)] dark:border-[#243350]/80 no-print">
          <div className="flex items-center gap-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/80 dark:bg-blue-900/20 px-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {selectedSharedProject.name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Shared by {selectedSharedProject._ownerName || selectedSharedProject._ownerEmail}
                {" · "}
                {selectedSharedProject._myRole === "editor" ? "Can edit" : "View only"}
                {selectedSharedProject._shareSource === "account" ? " · Full account access" : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (isListDrillIn) {
                  backFromProjectList();
                  return;
                }
                selectProject(TODAY_FILTER_ID);
              }}
              className="shrink-0 text-xs font-medium text-slate-600 dark:text-slate-300 hover:underline"
            >
              {isListDrillIn ? `Back to ${drillReturnLabel}` : "Back"}
            </button>
            <button
              type="button"
              onClick={() => handleLeaveSharedProject(selectedSharedProject)}
              className="shrink-0 inline-flex items-center px-2 py-1 rounded-md text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Stop seeing this project — removes your collaborator access"
            >
              Remove access
            </button>
          </div>
        </div>
      )}

      {/* Slim drill-in chrome: Back + Manage (replaces When/Layout + project tabs) */}
      {!projectManageOpen && viewMode === "list" && !isViewingSharedProject && isListDrillIn && (
        <div
          className="panel-pad-x pt-1.5 pb-1.5 relative border-b border-[color:var(--surface-border)] dark:border-[#243350]/80 no-print"
          ref={projectMenuRef}
        >
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={backFromProjectList}
              className="btn-chip gap-1.5 px-2.5 py-1.5 min-h-[2rem] text-xs font-semibold shrink-0 touch-target-sm"
              title={`Return to ${drillReturnLabel} view`}
              aria-label={`Back to ${drillReturnLabel}`}
              data-tour="back-from-project-list"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to {drillReturnLabel}
            </button>
            <div className="min-w-0 flex-1" />
            <ListToolbarProjectMenu
              project={listToolbarMenuProject}
              user={user}
              onManageProjects={openProjectManage}
              onStartRename={(p) => {
                startEditingProject(p);
                openProjectManage();
              }}
              onShare={setShareModalProject}
              onArchive={toggleProjectArchived}
              onDelete={deleteProject}
            />
          </div>
        </div>
      )}

      {/* Full project tabs — list view when not drilled in from Cards/Buckets */}
      {!projectManageOpen && viewMode === "list" && (<>
      {!isViewingSharedProject && !isListDrillIn && (
      <div className="panel-pad-x pt-1 pb-1.5 relative border-b border-[color:var(--surface-border)] dark:border-[#243350]/80 no-print" ref={projectMenuRef}>
        {/* Mobile: project dropdown (time scope is in the Tasks header) */}
        <div className="flex roomy:hidden items-center gap-1.5">
          <select
            value={isTimeFilter ? projectFilterId : selectedProjectId}
            onChange={(e) => {
              const value = e.target.value;
              if (value.startsWith("shared:")) {
                const [, ownerId, projectId] = value.split(":");
                const match = sharedProjects.find(
                  (p) => p._ownerId === ownerId && p.id === projectId,
                );
                if (match) void selectSharedProject(match);
                return;
              }
              selectProjectScope(value);
            }}
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
            {sharedProjects.length > 0 && (
              <optgroup label="Shared with me">
                {sharedProjects.map((sp) => (
                  <option
                    key={`shared:${sp._ownerId}:${sp.id}`}
                    value={`shared:${sp._ownerId}:${sp.id}`}
                  >
                    {sp.name} · {sp._ownerName || sp._ownerEmail.split("@")[0]}
                  </option>
                ))}
              </optgroup>
            )}
          </select>

          <ListToolbarProjectMenu
            project={listToolbarMenuProject}
            user={user}
            onManageProjects={openProjectManage}
            onStartRename={(p) => {
              startEditingProject(p);
              openProjectManage();
            }}
            onShare={setShareModalProject}
            onArchive={toggleProjectArchived}
            onDelete={deleteProject}
          />
        </div>

        {/* Desktop: horizontal scrolling project tabs */}
        <div className="hidden roomy:flex relative items-center gap-2" ref={projectTabsContainerRef}>
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
                    <span title="Pinned — appears first" className="flex-shrink-0">
                      <svg className="w-3 h-3 text-amber-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </span>
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
          <div className="relative min-w-0 flex-1">
          <div className="flex flex-nowrap items-center gap-2 overflow-x-auto scrollbar-hide">
          <button
            ref={allProjectsTabRef}
            onClick={() => selectProjectScope(ALL_PROJECTS_ID)}
            className={`flex-shrink-0 flex items-center gap-2 px-3.5 py-1.5 text-sm ${
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
            const tabClass = `flex-shrink-0 flex items-center gap-2 px-3.5 py-1.5 text-sm ${
              tabActive ? PROJECT_TAB_ACTIVE : PROJECT_TAB_INACTIVE
            } ${dragProjectId === p.id ? "opacity-50" : ""} ${
              dragOverProjectId === p.id && dragProjectId !== p.id
                ? "ring-2 ring-blue-400/70 ring-offset-1 ring-offset-transparent"
                : ""
            }`;
            if (editingProjectId === p.id) {
              return (
                <div key={p.id} className={tabClass}>
                  {p.color && (
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                  )}
                  <ProjectNameInput
                    value={editProjectName}
                    onChange={setEditProjectName}
                    onSave={saveProjectEdit}
                    onCancel={cancelEditingProject}
                    className="w-36 max-w-[10rem] sm:max-w-[14rem]"
                    ariaLabel={`Rename ${p.name}`}
                  />
                </div>
              );
            }
            return (
            <button
              key={p.id}
              draggable
              {...listProjectEditMenu.bind(p.id)}
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
              className={`${tabClass} cursor-grab active:cursor-grabbing`}
              title={`${projectTabTooltip(p)} — drag to reorder. Right-click to rename or change color.`}
            >
              {p.favorite && (
                <span title="Pinned — appears first" className="flex-shrink-0">
                  <svg className="w-3 h-3 text-amber-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </span>
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

          </div>
          {/* Fade hint for scrollable overflow */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-[#131d30] to-transparent" />

          {showOverflowProjectMenu && overflowProjectTabs.length > 0 && (
            <div className="absolute right-0 top-full mt-1 w-64 bg-white dark:bg-[#131d30] border border-slate-200 dark:border-[#243350] rounded-lg shadow-lg z-50 overflow-hidden animate-slide-up">
              <div className="max-h-64 overflow-y-auto py-1">
                {overflowProjectTabs.map((p) => {
                  const count = tasks.filter((t) => t.projectId === p.id && !t.completed).length;
                  return (
                    <button
                      key={p.id}
                      {...listProjectEditMenu.bind(p.id)}
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

          {/* + Project lives in When/Layout row — keep ⋯ menu only here */}
          <div ref={projectTabsToolbarRef} className="flex items-center gap-2 flex-shrink-0">
            <ListToolbarProjectMenu
              project={listToolbarMenuProject}
              user={user}
              onManageProjects={openProjectManage}
              onStartRename={(p) => {
                startEditingProject(p);
                openProjectManage();
              }}
              onShare={setShareModalProject}
              onArchive={toggleProjectArchived}
              onDelete={deleteProject}
            />
          </div>
        </div>

      </div>
      )}
      {listMenuProject && listMenu && (
        <ProjectEditMenu
          project={listMenuProject}
          x={listMenu.x}
          y={listMenu.y}
          onClose={listProjectEditMenu.close}
          onUpdateColor={updateProjectColor}
          onRename={
            canRenameProject(listMenuProject)
              ? () => {
                  startEditingProject(listMenuProject);
                  selectProjectScope(listMenuProject.id);
                }
              : undefined
          }
        />
      )}

      <div className="task-list-composer no-print panel-pad-x py-2 space-y-1.5">
        {/* Project description */}
        {!isViewingSharedProject && !isAllProjects && !isTimeFilter && currentProject && currentProject.id !== DEFAULT_PROJECT_ID && (
          <div className="space-y-2">
            {/* Due date */}
            {currentProject.dueDate && (
              <div className={`flex items-center gap-1.5 text-xs ${isDueDateOverdue(currentProject.dueDate) ? "urgency-text--mild" : "text-slate-500 dark:text-slate-400"}`}>
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
                  className="w-full px-3 py-2 text-sm border border-blue-300 rounded-lg bg-white text-slate-900 dark:bg-[#131d30] dark:text-white outline-none resize-y"
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
        {isViewingSharedProject ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 py-1">
            {canEditSharedProject
              ? "You can edit and complete tasks. Adding new tasks isn’t supported on shared projects."
              : "View-only access — you can browse tasks but not make changes."}
          </p>
        ) : (
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
            className="app-placeholder w-full min-w-0 sm:flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-[#243350] rounded-lg bg-white text-slate-900 dark:bg-[#131d30] dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
          />
          <div className="flex gap-2 min-w-0 w-full sm:w-auto">
          {!isListDrillIn && (
          <>
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
            className="app-placeholder flex-1 min-w-0 sm:flex-none sm:max-w-[11rem] px-2.5 py-2 text-sm border border-slate-200 dark:border-[#243350] rounded-lg bg-white text-slate-900 dark:bg-[#131d30] dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none truncate"
            aria-label="Project"
            title="Project"
          >
            {sortedProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          </>
          )}
          <DueDateField
            value={newTaskDueDate || undefined}
            onChange={(date) => setNewTaskDueDate(date ?? "")}
            requireExplicitPick={!newTaskDueDate}
            ariaLabel={newTaskDueDate ? `Due date: ${formatDueDate(newTaskDueDate)}. Click to change.` : "Set due date"}
            className={`flex items-center gap-1 min-w-0 flex-1 sm:flex-shrink-0 sm:max-w-[9.5rem] h-full px-2.5 py-2 text-sm border rounded-lg transition-colors ${
              newTaskDueDate
                ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                : "border-slate-200 dark:border-[#243350] bg-white dark:bg-[#131d30] text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-slate-100 hover:border-slate-300 dark:hover:border-[#3a5070]"
            }`}
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
          </DueDateField>
          <button
            type="submit"
            disabled={!newTaskTitle.trim()}
            className="btn-primary flex-shrink-0 px-4 py-2 text-sm touch-target-sm"
          >
            Add
          </button>
          </div>
        </form>

        {tasksReady && tasks.filter((t) => !t.archivedAt && !t.completed).length === 0 && !isTimeFilter && !focusMode && !isListDrillIn && (
          <div className="flex flex-wrap gap-1.5">
            <span className="text-xs text-slate-500 dark:text-slate-400 w-full">Quick start a project:</span>
            {PROJECT_TEMPLATES.slice(0, 4).map((tpl) => (
              <button
                key={tpl.label}
                type="button"
                onClick={() => addProject(tpl)}
                className="btn-chip px-2.5 py-1.5 text-xs touch-target-sm"
              >
                {tpl.emoji} {tpl.label}
              </button>
            ))}
          </div>
        )}
        </div>
        )}
      </div>

        <div className="task-list-body panel-pad-x pt-2 pb-1.5 space-y-1.5">
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

        {/* Empty state with project template gallery */}
        {tasksReady && pendingTasks.length === 0 && completedTasks.length === 0 && (
          <div className="py-4">
            <div className="text-center mb-6 px-4">
              {isTimeFilter || cardQuery.trim() ? (
                <FociDot mood="meh" size={56} className="mx-auto mb-3" />
              ) : (
                <BusyBeaver size={96} className="mx-auto mb-3" />
              )}
              <p className="text-slate-700 dark:text-slate-200 text-lg font-semibold mb-2">
                {cardQuery.trim()
                  ? `No tasks match “${cardQuery.trim()}”`
                  : isTimeFilter 
                  ? `No tasks due ${isTodayFilter ? "today" : isThisWeekFilter ? "this week" : isThisMonthFilter ? "this month" : "this year"}` 
                  : "Your task list is empty"}
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto mb-4">
                {cardQuery.trim()
                  ? "Try a different search, or clear the filter."
                  : isTimeFilter 
                  ? "Add a task above to get started" 
                  : isListDrillIn
                    ? "Add a task above to get started"
                    : "Beavy’s dam is empty — add a task above, or start from a template"}
              </p>
              {!isTimeFilter && !isListDrillIn && (
                <AddProjectButton onClick={openProjectManage} />
              )}
            </div>
            {!isTimeFilter && !isListDrillIn && !cardQuery.trim() && (
              <ProjectTemplatePicker variant="cards" onSelect={addProject} />
            )}
          </div>
        )}

        {/* First session nudge handled by AppMessageQueue on /app */}

        {(() => {
          const hasCompleted =
            doneTodayTasks.length > 0 || earlierCompletedTasks.length > 0;
          /** Open | Done side-by-side when both sides have work (avoids hollow empty left). */
          const useOpenDoneSplit =
            viewMode === "list" && pendingTasks.length > 0 && hasCompleted;
          /** Dense earlier grid when the list is long or sits alone under an empty open. */
          const densifyEarlier =
            earlierCompletedTasks.length >= 6 ||
            (pendingTasks.length === 0 && earlierCompletedTasks.length >= 4);

          const earlierList = earlierCompletedTasks.length > 0 && (
            <div className={useOpenDoneSplit ? "" : "pt-2 border-t border-slate-100 dark:border-[#1e3050]"}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="app-section-label text-slate-500 dark:text-slate-300">
                  {doneTodayTasks.length > 0
                    ? `Earlier (${earlierCompletedTasks.length})`
                    : `Completed (${earlierCompletedTasks.length})`}
                </span>
                <div className="no-print flex items-center gap-2">
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
              <div
                className={
                  densifyEarlier
                    ? "grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-0.5"
                    : "space-y-1"
                }
              >
                {earlierCompletedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-2 px-2 py-0.5 rounded-lg hover:bg-slate-50 dark:hover:bg-[#131d30] transition-colors min-w-0"
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
                    <span className="text-sm text-slate-400 dark:text-slate-400 line-through truncate min-w-0">
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
          );

          const doneColumn = hasCompleted && (
            <div className={`space-y-3 ${useOpenDoneSplit ? "" : "pt-2"}`}>
              <DoneTodaySection
                tasks={doneTodayTasks}
                onToggleComplete={toggleComplete}
                getProjectName={getProjectName}
                showProject={isAllProjects || isTimeFilter}
                defaultCollapsed={pendingTasks.length > 0}
                flush={useOpenDoneSplit}
              />
              {earlierList}
              {doneTodayTasks.length > 0 && earlierCompletedTasks.length === 0 && (
                <div className="no-print flex items-center justify-end gap-2">
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
              )}
            </div>
          );

          return (
            <div
              className={
                useOpenDoneSplit
                  ? "roomy:grid roomy:grid-cols-2 roomy:gap-5 roomy:items-start"
                  : undefined
              }
            >
              <OpenTaskList
                tasks={pendingTasks}
                activeTaskId={activeTaskId}
                oneThingTaskId={oneThingResolved.status === "active" ? oneThingResolved.task?.id ?? null : null}
                isTimerRunning={isTimerRunning}
                expandedTaskId={preparingPrint ? null : expandedTaskId}
                expandedSubtasksTaskId={preparingPrint ? null : expandedSubtasksTaskId}
                editingId={editingId}
                editTitle={editTitle}
                dragTaskId={dragTaskId}
                dragOverTaskId={dragOverTaskId}
                showProjectBadge
                isTimeFilter={isTimeFilter}
                isAllProjects={isAllProjects}
                getProjectName={getProjectName}
                noDueDateExpanded={preparingPrint || noDueDateExpanded}
                onToggleNoDueDateExpanded={() => setNoDueDateExpanded((open) => !open)}
                scopedUndatedOpenCount={scopedUndatedOpenCount}
                somedayExpanded={preparingPrint || somedayExpanded}
                onToggleSomedayExpanded={() => setSomedayExpanded((open) => !open)}
                scopedSomedayOpenCount={scopedSomedayOpenCount}
                twoColumn={viewMode === "list" && !useOpenDoneSplit}
                emptyMessage={hasCompleted ? "" : "No open tasks"}
                onToggleComplete={toggleComplete}
                onSaveEdit={saveEdit}
                onStartEdit={startEditing}
                onEditTitleChange={setEditTitle}
                onCancelEdit={() => setEditingId(null)}
                onToggleTaskDetail={toggleTaskDetail}
                onToggleSubtasks={toggleSubtasksExpanded}
                onStartTask={onStartTask}
                onSelectTask={onSelectTask}
                onDeleteTask={deleteTask}
                onSetDueDate={setDueDate}
                onSnoozeToToday={snoozeToToday}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                renderBelowTask={preparingPrint ? () => null : renderTaskInlineExpansion}
                {...createTaskListDnD(pendingTasks)}
              />
              {doneColumn}
            </div>
          );
        })()}

        {/* Archived tasks */}
        {viewMode === "list" && archivedTasks.length > 0 && (
          <div className="pt-2 border-t border-slate-100 dark:border-[#1e3050]">
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="no-print flex items-center gap-1.5 app-section-label text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors w-full"
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
            {(preparingPrint || showArchived) && (
              <div className="space-y-1 mt-1.5">
                {archivedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="group flex items-center gap-2 px-2 py-0.5 rounded-lg"
                  >
                    <svg className="w-4 h-4 flex-shrink-0 text-slate-400 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                    <span className="text-sm text-slate-400 dark:text-slate-400 line-through truncate">
                      {task.title}
                    </span>
                    <button
                      onClick={() => unarchiveTask(task.id)}
                      className="no-print ml-auto flex-shrink-0 text-xs text-slate-400 hover:text-blue-500 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
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

      {/* Task detail drawer — bucket and card views */}
      {(viewMode === "bucket" || viewMode === "card") && expandedTaskId && (() => {
        const task = tasks.find((t) => t.id === expandedTaskId);
        if (!task) return null;
        return (
          <TaskExpansionDrawer
            task={task}
            onClose={closeTaskDetail}
            isEditingTitle={editingId === task.id}
            editTitle={editTitle}
            onStartEditTitle={startEditing}
            onEditTitleChange={setEditTitle}
            onSaveTitle={saveEdit}
            onCancelEditTitle={() => setEditingId(null)}
          >
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

      <DayRecap
        show={showDayRecap}
        summary={globalDoneTodaySummary}
        onDismiss={dismissDayRecap}
      />

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
