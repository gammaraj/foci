import { MAX_PROJECT_NAME, MAX_TASK_TITLE, pickProjectColor } from "@/components/task-list/utils";
import {
  buildBoostLogikProjectName,
  buildBoostLogikTaskTitle,
  parseDurationMinutes,
  toBoostLogikContext,
  type BoostLogikContext,
  type BoostLogikDeepLinkParams,
} from "@/lib/boostlogik-integration";
import {
  loadProjects,
  loadTasks,
  saveProjects,
  saveSelectedProjectId,
  saveTasks,
} from "@/lib/storage";
import type { Project, Task } from "@/lib/types";

export interface BoostLogikBootstrapResult {
  taskId: string | null;
  durationMinutes: number | null;
  context: BoostLogikContext;
}

export async function bootstrapBoostLogikSession(
  params: BoostLogikDeepLinkParams
): Promise<BoostLogikBootstrapResult> {
  const context = toBoostLogikContext(params);
  const durationMinutes = parseDurationMinutes(params.duration);
  let taskId: string | null = null;

  if (params.projectName || params.task) {
    const projects = await loadProjects();
    const projectName = buildBoostLogikProjectName(params);
    let project = projects.find((p) => p.name === projectName);

    if (!project) {
      const nextColor = pickProjectColor(projects);
      const maxOrder = Math.max(0, ...projects.map((p) => p.order ?? 0));

      project = {
        id: crypto.randomUUID(),
        name: projectName.slice(0, MAX_PROJECT_NAME),
        color: nextColor,
        order: maxOrder + 1,
        description: params.returnUrl
          ? `BoostLogik SEO work — ${params.returnUrl}`
          : "BoostLogik SEO and marketing tasks",
        createdAt: Date.now(),
      } satisfies Project;

      await saveProjects([...projects, project]);
    }

    await saveSelectedProjectId(project.id);

    const tasks = await loadTasks();
    const taskTitle = buildBoostLogikTaskTitle(params);
    let task = tasks.find(
      (t) => t.projectId === project!.id && t.title === taskTitle && !t.completed
    );

    if (!task) {
      const projectTasks = tasks.filter((t) => t.projectId === project!.id);
      const maxOrder = Math.max(0, ...projectTasks.map((t) => t.order ?? 0));

      task = {
        id: crypto.randomUUID(),
        title: taskTitle.slice(0, MAX_TASK_TITLE),
        completed: false,
        sessions: 0,
        timeSpent: 0,
        createdAt: Date.now(),
        projectId: project.id,
        order: maxOrder + 1,
        description: params.returnUrl
          ? `Continue on BoostLogik → ${params.returnUrl}`
          : undefined,
      } satisfies Task;

      await saveTasks([...tasks, task]);
    }

    taskId = task.id;
  }

  return { taskId, durationMinutes, context };
}
