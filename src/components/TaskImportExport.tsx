"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Task,
  Project,
  DEFAULT_PROJECT_ID,
  DEFAULT_PROJECT,
} from "@/lib/types";
import { loadTasks, saveTasks, loadProjects, saveProjects } from "@/lib/storage";
import { MAX_PROJECT_NAME, pickProjectColor } from "@/components/task-list/utils";
import {
  detectAndParse,
  FORMAT_LABELS,
  type DetectedFormat,
  type ParsedTask,
} from "@/lib/import-parsers";

function uuid(): string {
  return crypto.randomUUID();
}

function uniqueProjectNames(tasks: ParsedTask[]): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const t of tasks) {
    const name = t.projectName?.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (key === "general" || seen.has(key)) continue;
    seen.add(key);
    names.push(name);
  }
  return names;
}

/** Split file project names into ones that already exist vs ones import will create. */
function classifyImportProjects(
  names: string[],
  existing: Project[],
): { matchExisting: { fileName: string; existingName: string }[]; createNew: string[] } {
  const byKey = new Map<string, string>();
  for (const p of existing) {
    if (p.archived) continue;
    byKey.set(p.name.trim().toLowerCase(), p.name);
  }
  byKey.set("general", "General");

  const matchExisting: { fileName: string; existingName: string }[] = [];
  const createNew: string[] = [];
  for (const name of names) {
    const key = name.toLowerCase();
    const existingName = byKey.get(key);
    if (existingName) {
      matchExisting.push({ fileName: name, existingName });
    } else {
      createNew.push(name);
    }
  }
  return { matchExisting, createNew };
}

function formatNameList(names: string[], limit = 3): string {
  if (names.length === 0) return "";
  const shown = names.slice(0, limit);
  const extra = names.length - shown.length;
  return shown.map((n) => `“${n}”`).join(", ") + (extra > 0 ? `, +${extra} more` : "");
}

/** Match existing projects by name (case-insensitive); create any that are missing. */
function resolveProjectIds(
  tasks: ParsedTask[],
  existing: Project[],
): {
  projectIdFor: (projectName?: string) => string;
  projects: Project[];
  createdCount: number;
  createdIds: string[];
} {
  const projects = existing.some((p) => p.id === DEFAULT_PROJECT_ID)
    ? [...existing]
    : [DEFAULT_PROJECT, ...existing];

  const nameToId = new Map<string, string>();
  for (const p of projects) {
    nameToId.set(p.name.trim().toLowerCase(), p.id);
  }
  nameToId.set("general", DEFAULT_PROJECT_ID);

  let createdCount = 0;
  const createdIds: string[] = [];

  const ensureProject = (raw?: string): string => {
    const name = raw?.trim().slice(0, MAX_PROJECT_NAME);
    if (!name) return DEFAULT_PROJECT_ID;
    const key = name.toLowerCase();
    if (key === "general") return DEFAULT_PROJECT_ID;
    const existingId = nameToId.get(key);
    if (existingId) return existingId;

    const nextColor = pickProjectColor(projects);
    const project: Project = {
      id: uuid(),
      name,
      color: nextColor,
      // Temporary — reassigned below so new imports sort first.
      order: 0,
      createdAt: Date.now() + createdCount,
    };
    projects.push(project);
    nameToId.set(key, project.id);
    createdIds.push(project.id);
    createdCount += 1;
    return project.id;
  };

  // Prefetch so createdCount is accurate before mapping tasks
  for (const t of tasks) {
    ensureProject(t.projectName);
  }

  return {
    projectIdFor: (projectName?: string) => ensureProject(projectName),
    projects,
    createdCount,
    createdIds,
  };
}

/** Put the given projects at the front of tab/card order (before other unpinned). */
function moveProjectsToFront(projects: Project[], frontIds: string[]): Project[] {
  const unique = [...new Set(frontIds.filter((id) => id && id !== DEFAULT_PROJECT_ID))];
  if (unique.length === 0) return projects;

  const restOrders = projects
    .filter((p) => !p.archived && !unique.includes(p.id))
    .map((p) => p.order ?? 0);
  const restMin = restOrders.length > 0 ? Math.min(0, ...restOrders) : 0;
  const orderById = new Map(unique.map((id, i) => [id, restMin - unique.length + i]));

  return projects.map((p) =>
    orderById.has(p.id) ? { ...p, order: orderById.get(p.id)! } : p,
  );
}

function toFociTasks(
  parsed: ParsedTask[],
  projectIdFor: (projectName?: string) => string,
  orderBase = 0,
): Task[] {
  const now = Date.now();
  return parsed.map((p, i) => ({
    id: uuid(),
    title: p.title.slice(0, 200),
    completed: p.completed || false,
    sessions: 0,
    timeSpent: 0,
    createdAt: now + i,
    ...(p.completed ? { completedAt: now + i } : {}),
    projectId: projectIdFor(p.projectName),
    ...(p.description?.trim()
      ? { description: p.description.trim().slice(0, 2000) }
      : {}),
    subtasks: p.subtasks?.map((s) => ({
      id: uuid(),
      title: s.title.slice(0, 200),
      completed: s.completed || false,
    })),
    order: orderBase + i,
    dueDate: p.dueDate,
  }));
}

function exportToJSON(tasks: Task[], projects: Project[]): string {
  return JSON.stringify(
    {
      tasks,
      projects,
      exportedAt: new Date().toISOString(),
      format: "foci",
    },
    null,
    2,
  );
}

function escapeCSVField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function exportToCSV(tasks: Task[], projects: Project[]): string {
  const nameById = new Map<string, string>([[DEFAULT_PROJECT_ID, "General"]]);
  for (const p of projects) {
    nameById.set(p.id, p.name);
  }
  const headers = [
    "Title",
    "Completed",
    "Due Date",
    "Project",
    "Sessions",
    "Time Spent (min)",
    "Created At",
  ];
  const rows = tasks.map((t) => [
    escapeCSVField(t.title),
    t.completed ? "Yes" : "No",
    t.dueDate || "",
    escapeCSVField(nameById.get(t.projectId) || "General"),
    String(t.sessions),
    String(Math.round(t.timeSpent / 60000)),
    new Date(t.createdAt).toISOString(),
  ]);
  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export type ImportResult = {
  tasks: Task[];
  projects: Project[];
  /** Primary project to open so the user can see what was imported. */
  focusProjectId?: string;
};

interface TaskImportExportProps {
  onTasksImported?: (result?: ImportResult) => void;
  /** Hide export section (e.g. Projects page embed). */
  importOnly?: boolean;
  /** Let the user put all tasks into an existing or new project. */
  showDestinationPicker?: boolean;
  /** Existing projects for the destination dropdown. */
  projects?: Project[];
  /** Pre-select an existing project. */
  initialProjectId?: string;
}

type ImportDestination =
  | { mode: "file" }
  | { mode: "existing"; projectId: string }
  | { mode: "new"; name: string };

export default function TaskImportExport({
  onTasksImported,
  importOnly = false,
  showDestinationPicker = false,
  projects: projectsProp,
  initialProjectId,
}: TaskImportExportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importState, setImportState] = useState<
    | { step: "idle" }
    | { step: "preview"; format: DetectedFormat; tasks: ParsedTask[]; fileName: string }
    | { step: "importing" }
    | { step: "done"; count: number; projectsCreated: number }
    | { step: "error"; message: string }
  >({ step: "idle" });
  const [importCompleted, setImportCompleted] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [destination, setDestination] = useState<ImportDestination>({ mode: "file" });
  const [newProjectName, setNewProjectName] = useState("");
  /** Projects used for new-vs-existing preview (props when provided, else loaded). */
  const [loadedProjects, setLoadedProjects] = useState<Project[]>([]);

  const availableProjects = (projectsProp ?? loadedProjects).filter((p) => !p.archived);
  const defaultExistingId =
    initialProjectId && availableProjects.some((p) => p.id === initialProjectId)
      ? initialProjectId
      : availableProjects.find((p) => p.id !== DEFAULT_PROJECT_ID)?.id ??
        availableProjects[0]?.id ??
        DEFAULT_PROJECT_ID;

  useEffect(() => {
    if (projectsProp) return;
    let cancelled = false;
    loadProjects()
      .then((projects) => {
        if (!cancelled) setLoadedProjects(projects);
      })
      .catch(() => {
        if (!cancelled) setLoadedProjects([]);
      });
    return () => {
      cancelled = true;
    };
  }, [projectsProp]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setImportState({ step: "error", message: "File too large. Maximum size is 5 MB." });
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text !== "string") {
        setImportState({ step: "error", message: "Could not read file." });
        return;
      }

      const { format, tasks } = detectAndParse(text, file.name);
      if (format === "unknown" || tasks.length === 0) {
        setImportState({
          step: "error",
          message:
            "Could not detect format. Supported: Foci JSON, Google Tasks JSON, Todoist CSV, Asana CSV, Notion CSV, or any CSV with a Title/Name column. Include a Project column to create projects.",
        });
      } else {
        setImportState({ step: "preview", format, tasks, fileName: file.name });
        // Prefer the file's Project column when present so imports aren't silently
        // dumped into whatever project happens to be first in the dropdown.
        if (showDestinationPicker && uniqueProjectNames(tasks).length > 0) {
          setDestination({ mode: "file" });
        }
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleImport = async () => {
    if (importState.step !== "preview") return;

    if (destination.mode === "new" && !newProjectName.trim()) {
      setImportState({ step: "error", message: "Enter a name for the new project." });
      return;
    }
    if (destination.mode === "existing" && !destination.projectId) {
      setImportState({ step: "error", message: "Choose a project to import into." });
      return;
    }

    setImportState({ step: "importing" });

    try {
      let tasksToImport = importState.tasks;
      if (!importCompleted) {
        tasksToImport = tasksToImport.filter((t) => !t.completed);
      }
      const existingProjects = await loadProjects();

      let projectIdFor: (projectName?: string) => string;
      let projects = existingProjects;
      let createdCount = 0;
      let createdIds: string[] = [];
      let focusProjectId: string | undefined;

      if (destination.mode === "existing") {
        const targetId = destination.projectId;
        projectIdFor = () => targetId;
        focusProjectId = targetId;
      } else if (destination.mode === "new") {
        const resolved = resolveProjectIds(
          [{ title: "_", projectName: newProjectName.trim() }],
          existingProjects,
        );
        projects = resolved.projects;
        createdCount = resolved.createdCount;
        createdIds = resolved.createdIds;
        const targetId = resolved.projectIdFor(newProjectName.trim());
        projectIdFor = () => targetId;
        focusProjectId = targetId;
      } else {
        const resolved = resolveProjectIds(tasksToImport, existingProjects);
        projects = resolved.projects;
        createdCount = resolved.createdCount;
        createdIds = resolved.createdIds;
        projectIdFor = resolved.projectIdFor;
        const firstNamed = tasksToImport.find((t) => t.projectName?.trim())?.projectName;
        focusProjectId = firstNamed
          ? projectIdFor(firstNamed)
          : projectIdFor(undefined);
      }

      // Newly imported / target project(s) appear first in Cards, Buckets, and tabs.
      const frontIds =
        createdIds.length > 0
          ? createdIds
          : focusProjectId
            ? [focusProjectId]
            : [];
      const orderedProjects = moveProjectsToFront(projects, frontIds);
      const shouldSaveProjects = createdCount > 0 || frontIds.some((id) => id !== DEFAULT_PROJECT_ID);

      const existing = await loadTasks();
      const orderBase =
        Math.max(
          -1,
          ...existing
            .filter((t) => !t.completed && !t.archivedAt && t.order != null)
            .map((t) => t.order as number),
        ) + 1;
      const newTasks = toFociTasks(tasksToImport, projectIdFor, orderBase);
      if (shouldSaveProjects) {
        await saveProjects(orderedProjects);
      }
      const mergedTasks = [...existing, ...newTasks];
      await saveTasks(mergedTasks);
      setImportState({ step: "done", count: newTasks.length, projectsCreated: createdCount });
      if (!projectsProp) setLoadedProjects(orderedProjects);
      onTasksImported?.({
        tasks: mergedTasks,
        projects: orderedProjects,
        focusProjectId,
      });
    } catch {
      setImportState({ step: "error", message: "Failed to import tasks. Please try again." });
    }
  };

  const handleExport = async (type: "json" | "csv") => {
    setExporting(true);
    try {
      const [tasks, projects] = await Promise.all([loadTasks(), loadProjects()]);
      if (tasks.length === 0) {
        setImportState({ step: "error", message: "No tasks to export." });
        return;
      }
      const date = new Date().toISOString().slice(0, 10);
      if (type === "json") {
        downloadFile(exportToJSON(tasks, projects), `foci-tasks-${date}.json`, "application/json");
      } else {
        downloadFile(exportToCSV(tasks, projects), `foci-tasks-${date}.csv`, "text/csv");
      }
    } finally {
      setExporting(false);
    }
  };

  const previewProjects =
    importState.step === "preview" ? uniqueProjectNames(importState.tasks) : [];

  const projectPlan = useMemo(
    () => classifyImportProjects(previewProjects, availableProjects),
    [previewProjects, availableProjects],
  );

  const destinationSummary = (() => {
    if (destination.mode === "existing") {
      const name =
        availableProjects.find((p) => p.id === destination.projectId)?.name ?? "selected project";
      return `into existing project “${name}”`;
    }
    if (destination.mode === "new") {
      const name = newProjectName.trim();
      if (!name) return "into a new project (enter a name)";
      const match = availableProjects.find((p) => p.name.trim().toLowerCase() === name.toLowerCase());
      return match
        ? `into existing project “${match.name}” (name already used)`
        : `into new project “${name}”`;
    }
    if (previewProjects.length === 0) {
      return "into General (no Project column)";
    }
    const parts: string[] = [];
    if (projectPlan.createNew.length > 0) {
      parts.push(
        projectPlan.createNew.length === 1
          ? `will create new project ${formatNameList(projectPlan.createNew)}`
          : `will create ${projectPlan.createNew.length} new projects (${formatNameList(projectPlan.createNew)})`,
      );
    }
    if (projectPlan.matchExisting.length > 0) {
      const names = projectPlan.matchExisting.map((m) => m.existingName);
      parts.push(
        names.length === 1
          ? `will add to existing project ${formatNameList(names)}`
          : `will add to ${names.length} existing projects (${formatNameList(names)})`,
      );
    }
    return parts.join(" · ");
  })();

  const filteredCount =
    importState.step === "preview"
      ? importCompleted
        ? importState.tasks.length
        : importState.tasks.filter((t) => !t.completed).length
      : 0;

  return (
    <div className="space-y-4">
      {!importOnly && (
        <>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              Download all your tasks as a backup or to use in another app.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleExport("json")}
                disabled={exporting}
                className="flex-1 px-3 py-2 rounded-lg text-sm font-medium border border-slate-200 dark:border-[#243350] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1a2d4a] transition disabled:opacity-50"
              >
                Export JSON
              </button>
              <button
                type="button"
                onClick={() => handleExport("csv")}
                disabled={exporting}
                className="flex-1 px-3 py-2 rounded-lg text-sm font-medium border border-slate-200 dark:border-[#243350] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1a2d4a] transition disabled:opacity-50"
              >
                Export CSV
              </button>
            </div>
          </div>
          <div className="border-t border-slate-200 dark:border-[#243350]" />
        </>
      )}

      {/* Import */}
      <div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
          {showDestinationPicker
            ? "Import from Google Tasks, Todoist, Asana, Notion, or CSV into an existing or new project."
            : (
              <>
                Import tasks from Google Tasks, Todoist, Asana, Notion, or any CSV. A{" "}
                <strong className="font-medium text-slate-600 dark:text-slate-300">Project</strong>{" "}
                column creates or matches projects automatically.
              </>
            )}
        </p>

        {showDestinationPicker && (
          <fieldset className="mb-3 space-y-2 rounded-lg border border-slate-200 dark:border-[#243350] p-3">
            <legend className="px-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
              Put tasks in
            </legend>
            <label className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200 cursor-pointer">
              <input
                type="radio"
                name="import-dest"
                className="mt-1"
                checked={destination.mode === "existing"}
                onChange={() =>
                  setDestination({ mode: "existing", projectId: defaultExistingId })
                }
              />
              <span className="min-w-0 flex-1 space-y-1.5">
                <span className="block font-medium">Existing project</span>
                {destination.mode === "existing" && (
                  <select
                    value={destination.projectId}
                    onChange={(e) =>
                      setDestination({ mode: "existing", projectId: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 text-sm rounded-md border border-slate-200 dark:border-[#243350] bg-[var(--surface-elevated)] text-slate-900 dark:bg-[#131d30] dark:text-white"
                  >
                    {availableProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                )}
              </span>
            </label>
            <label className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200 cursor-pointer">
              <input
                type="radio"
                name="import-dest"
                className="mt-1"
                checked={destination.mode === "new"}
                onChange={() => setDestination({ mode: "new", name: newProjectName })}
              />
              <span className="min-w-0 flex-1 space-y-1.5">
                <span className="block font-medium">New project</span>
                {destination.mode === "new" && (
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => {
                      setNewProjectName(e.target.value);
                      setDestination({ mode: "new", name: e.target.value });
                    }}
                    placeholder="Project name"
                    maxLength={MAX_PROJECT_NAME}
                    className="w-full px-2.5 py-1.5 text-sm rounded-md border border-slate-200 dark:border-[#243350] bg-[var(--surface-elevated)] text-slate-900 dark:bg-[#131d30] dark:text-white outline-none focus:border-blue-400"
                  />
                )}
              </span>
            </label>
            <label className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200 cursor-pointer">
              <input
                type="radio"
                name="import-dest"
                className="mt-1"
                checked={destination.mode === "file"}
                onChange={() => setDestination({ mode: "file" })}
              />
              <span>
                <span className="block font-medium">Projects from file</span>
                <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Use the Project column when present; otherwise General.
                </span>
              </span>
            </label>
          </fieldset>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.csv,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium border-2 border-dashed border-slate-300 dark:border-[#243350] text-slate-600 dark:text-slate-300 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition bg-slate-50/50 dark:bg-[#131d30]/50"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M16 8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Choose file to import...
        </button>

        {/* Import Preview */}
        {importState.step === "preview" && (
          <div className="mt-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                {FORMAT_LABELS[importState.format]}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {importState.fileName}
              </span>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-200">
              Found <strong>{importState.tasks.length}</strong> task
              {importState.tasks.length !== 1 ? "s" : ""}
              {importState.tasks.filter((t) => t.completed).length > 0 && (
                <span className="text-slate-500 dark:text-slate-400">
                  {" "}
                  ({importState.tasks.filter((t) => t.completed).length} completed)
                </span>
              )}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300">{destinationSummary}</p>
            {destination.mode === "file" &&
              (projectPlan.createNew.length > 0 || projectPlan.matchExisting.length > 0) && (
              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1 rounded-md bg-white/60 dark:bg-[#0f172a]/40 px-2.5 py-2 border border-blue-100 dark:border-blue-900/40">
                {projectPlan.createNew.map((name) => (
                  <li key={`new:${name}`} className="flex items-start gap-1.5">
                    <span className="shrink-0 mt-0.5 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wide bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                      New
                    </span>
                    <span>
                      Create project <strong className="font-medium text-slate-800 dark:text-slate-100">{name}</strong>
                    </span>
                  </li>
                ))}
                {projectPlan.matchExisting.map(({ fileName, existingName }) => (
                  <li key={`ex:${fileName}`} className="flex items-start gap-1.5">
                    <span className="shrink-0 mt-0.5 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wide bg-slate-200 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300">
                      Existing
                    </span>
                    <span>
                      Add to <strong className="font-medium text-slate-800 dark:text-slate-100">{existingName}</strong>
                      {existingName.toLowerCase() !== fileName.toLowerCase() && (
                        <span className="text-slate-400"> (from “{fileName}”)</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-0.5 max-h-28 overflow-y-auto">
              {importState.tasks.slice(0, 5).map((t, i) => (
                <li key={i} className="flex items-center gap-1.5 truncate">
                  <span className={t.completed ? "line-through text-slate-400" : ""}>{t.title}</span>
                  {destination.mode === "file" && t.projectName && (
                    <span className="text-slate-400 dark:text-slate-400 flex-shrink-0">
                      · {t.projectName}
                    </span>
                  )}
                  {t.dueDate && (
                    <span className="text-slate-400 dark:text-slate-400 flex-shrink-0">
                      · {t.dueDate}
                    </span>
                  )}
                </li>
              ))}
              {importState.tasks.length > 5 && (
                <li className="text-slate-400 dark:text-slate-400">
                  …and {importState.tasks.length - 5} more
                </li>
              )}
            </ul>

            {importState.tasks.some((t) => t.completed) && (
              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={importCompleted}
                  onChange={(e) => setImportCompleted(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-300"
                />
                Include completed tasks
              </label>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleImport}
                disabled={filteredCount === 0}
                className="btn-primary flex-1 px-3 py-2 text-sm"
              >
                Import {filteredCount} task{filteredCount !== 1 ? "s" : ""}
              </button>
              <button
                type="button"
                onClick={() => setImportState({ step: "idle" })}
                className="btn-ghost px-3 py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {importState.step === "importing" && (
          <div className="mt-3 p-3 rounded-lg bg-slate-50 dark:bg-[#131d30] border border-slate-200 dark:border-[#243350] text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2">
            <span className="inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            Importing…
          </div>
        )}

        {importState.step === "done" && (
          <div className="mt-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 space-y-2">
            <p className="text-sm text-emerald-800 dark:text-emerald-200">
              Imported {importState.count} task{importState.count !== 1 ? "s" : ""}
              {importState.projectsCreated > 0
                ? ` and created ${importState.projectsCreated} project${
                    importState.projectsCreated !== 1 ? "s" : ""
                  }`
                : ""}
              !
            </p>
            <button
              type="button"
              onClick={() => setImportState({ step: "idle" })}
              className="text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:underline"
            >
              Import another file
            </button>
          </div>
        )}

        {importState.step === "error" && (
          <div className="mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 space-y-2">
            <p className="text-sm text-red-700 dark:text-red-300">{importState.message}</p>
            <button
              type="button"
              onClick={() => setImportState({ step: "idle" })}
              className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline"
            >
              Try again
            </button>
          </div>
        )}
      </div>

      {!importOnly && (
        <div className="text-xs text-slate-400 dark:text-slate-400 space-y-1">
          <p className="font-medium text-slate-500 dark:text-slate-400">Supported import formats:</p>
          <ul className="grid grid-cols-2 gap-x-2 gap-y-0.5">
            <li>• Google Tasks (JSON)</li>
            <li>• Todoist (CSV)</li>
            <li>• Asana (CSV)</li>
            <li>• Notion (CSV)</li>
            <li>• Foci backup (JSON)</li>
            <li>• CSV with Title + optional Project</li>
          </ul>
        </div>
      )}
    </div>
  );
}
