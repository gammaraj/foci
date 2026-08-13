import type { SupabaseClient } from "@supabase/supabase-js";
import { showToastGlobal } from "@/components/ToastProvider";
import {
  Settings,
  DailyGoalData,
  StreakHistory,
  Task,
  Project,
  TaskPriority,
  TaskKind,
  DEFAULT_SETTINGS,
  DEFAULT_PROJECT,
  ALL_PROJECTS_ID,
  TODAY_FILTER_ID,
} from "../types";
import type { StorageAdapter, CollaboratorInfo, CollaborationInvite, SharedProject, CollaboratorRole, AccountCollaboratorInfo, AccountInvite } from "./types";
import {
  DEFAULT_TASK_VIEW_PREFERENCES,
  isDefaultTaskView,
  type TaskViewPreferences,
} from "../task-view-preference";
import type { OneThingPreference } from "../one-thing";
import { getToday, getYesterday, formatDateLocal } from "../dates";

/** Migrate old toDateString() format ("Wed Mar 12 2026") to ISO ("2026-03-12"). */
function migrateDate(dateStr: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) return formatDateLocal(parsed);
  return getToday();
}

type TaskRow = {
  id: string;
  title: string;
  completed: boolean;
  sessions: number;
  time_spent: number;
  created_at: number;
  completed_at?: number | null;
  project_id: string;
  subtasks: Task["subtasks"];
  description?: string | null;
  due_date?: string | null;
  order?: number | null;
  archived_at?: number | null;
  recurrence?: Task["recurrence"] | null;
  priority?: number | null;
  blocked?: boolean | null;
  someday?: boolean | null;
  kind?: string | null;
};

function parseTaskKind(value: string | null | undefined): TaskKind | undefined {
  if (value === "note" || value === "question") return value;
  return undefined;
}

function mapTaskRow(row: TaskRow): Task {
  const kind = parseTaskKind(row.kind);
  return {
    id: row.id,
    title: row.title,
    completed: row.completed,
    sessions: row.sessions,
    timeSpent: row.time_spent,
    createdAt: row.created_at,
    projectId: row.project_id,
    subtasks: row.subtasks ?? [],
    ...(row.completed_at ? { completedAt: row.completed_at } : {}),
    ...(row.description ? { description: row.description } : {}),
    ...(row.due_date ? { dueDate: row.due_date } : {}),
    ...(row.order !== null && row.order !== undefined ? { order: row.order } : {}),
    ...(row.archived_at ? { archivedAt: row.archived_at } : {}),
    ...(row.recurrence ? { recurrence: row.recurrence } : {}),
    ...(row.priority != null ? { priority: row.priority as TaskPriority } : {}),
    ...(row.blocked ? { blocked: true } : {}),
    ...(row.someday ? { someday: true } : {}),
    ...(kind ? { kind } : {}),
  };
}

function taskToRow(task: Task, userId: string) {
  return {
    id: task.id,
    user_id: userId,
    title: task.title,
    completed: task.completed,
    sessions: task.sessions,
    time_spent: task.timeSpent,
    created_at: task.createdAt,
    completed_at: task.completedAt ?? null,
    project_id: task.projectId,
    subtasks: task.subtasks ?? [],
    description: task.description ?? null,
    due_date: task.dueDate ?? null,
    "order": task.order ?? null,
    archived_at: task.archivedAt ?? null,
    recurrence: task.recurrence ?? null,
    priority: task.priority ?? null,
    blocked: task.blocked ?? false,
    someday: task.someday ?? false,
    kind: task.kind ?? "task",
  };
}

function isTransientSyncError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("connection timeout") ||
    m.includes("upstream connect error") ||
    m.includes("disconnect/reset") ||
    m.includes("failed to fetch") ||
    m.includes("networkerror") ||
    m.includes("network request failed") ||
    m.includes("load failed") ||
    m.includes("timed out") ||
    m.includes("timeout") ||
    m.includes("fetch failed") ||
    m.includes("abort") ||
    m.includes("503") ||
    m.includes("502") ||
    m.includes("504")
  );
}

async function withRetries<T>(
  run: () => Promise<T>,
  options?: { attempts?: number; label?: string },
): Promise<T> {
  const attempts = options?.attempts ?? 3;
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await run();
    } catch (err) {
      lastError = err;
      const message = err instanceof Error ? err.message : String(err);
      if (!isTransientSyncError(message) || i === attempts - 1) throw err;
      await new Promise((r) => setTimeout(r, 250 * (i + 1) * (i + 1)));
      console.warn(
        `[Foci] Retrying ${options?.label ?? "storage write"} (${i + 2}/${attempts}):`,
        message,
      );
    }
  }
  throw lastError;
}

/** Throw if a Supabase response has an error. */
function check<T>(
  result: { data: T; error: { message: string } | null },
  options?: { silent?: boolean },
): T {
  if (result.error) {
    const message = result.error.message;
    if (!options?.silent && !isTransientSyncError(message)) {
      showToastGlobal(`Sync error: ${message}`, "error");
    } else {
      console.warn("[Foci] Supabase sync issue:", message);
    }
    throw new Error(message);
  }
  return result.data;
}

/**
 * Supabase-backed implementation of StorageAdapter.
 * Requires an authenticated Supabase client (user session must be active).
 */
export class SupabaseStorageAdapter implements StorageAdapter {
  private cachedUserId: string | null = null;

  constructor(private supabase: SupabaseClient) {}

  private async getUserId(): Promise<string> {
    if (this.cachedUserId) return this.cachedUserId;
    // Prefer local session so offline / flaky networks still resolve the user id.
    // getUser() always hits the Auth server and can hang or fail offline.
    const {
      data: { session },
    } = await this.supabase.auth.getSession();
    if (session?.user) {
      this.cachedUserId = session.user.id;
      return session.user.id;
    }
    const {
      data: { user },
    } = await this.supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    this.cachedUserId = user.id;
    return user.id;
  }

  // ── Settings ──────────────────────────────────────────

  async loadSettings(): Promise<Settings> {
    const userId = await this.getUserId();
    const data = check(
      await this.supabase
        .from("settings")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle(),
      { silent: true },
    );

    if (!data) return DEFAULT_SETTINGS;

    return {
      workDuration: data.work_duration,
      breakDuration: data.break_duration,
      inactivityThreshold: data.inactivity_threshold,
      dailyGoal: data.daily_goal,
      autoStartEnabled: data.auto_start_enabled,
      notificationsEnabled: data.notifications_enabled,
    };
  }

  async saveSettings(settings: Settings): Promise<void> {
    const userId = await this.getUserId();
    check(
      await this.supabase.from("settings").upsert({
        user_id: userId,
        work_duration: settings.workDuration,
        break_duration: settings.breakDuration,
        inactivity_threshold: settings.inactivityThreshold,
        daily_goal: settings.dailyGoal,
        auto_start_enabled: settings.autoStartEnabled,
        notifications_enabled: settings.notificationsEnabled,
        updated_at: new Date().toISOString(),
      })
    );
  }

  // ── Daily Goal ────────────────────────────────────────

  async loadDailyGoalData(dailyGoal: number): Promise<DailyGoalData> {
    const userId = await this.getUserId();
    const data = check(
      await this.supabase
        .from("daily_goal_data")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle(),
      { silent: true },
    );

    const today = getToday();

    if (!data) {
      const initial: DailyGoalData = {
        date: today,
        sessionCount: 0,
        streak: 0,
        lastStreakUpdate: null,
      };
      await this.saveDailyGoalData(initial);
      return initial;
    }

    const saved: DailyGoalData = {
      date: migrateDate(data.date),
      sessionCount: data.session_count,
      streak: data.streak,
      lastStreakUpdate: data.last_streak_update ? migrateDate(data.last_streak_update) : null,
    };

    if (saved.date === today) return saved;

    const yesterday = getYesterday();
    const wasGoalMet =
      saved.date === yesterday && saved.sessionCount >= dailyGoal;

    const newData: DailyGoalData = {
      date: today,
      sessionCount: 0,
      streak: wasGoalMet ? saved.streak : 0,
      lastStreakUpdate: null,
    };
    await this.saveDailyGoalData(newData);
    return newData;
  }

  async saveDailyGoalData(data: DailyGoalData): Promise<void> {
    const userId = await this.getUserId();
    check(
      await this.supabase.from("daily_goal_data").upsert({
        user_id: userId,
        date: data.date,
        session_count: data.sessionCount,
        streak: data.streak,
        last_streak_update: data.lastStreakUpdate,
        updated_at: new Date().toISOString(),
      })
    );
  }

  // ── Streak History ────────────────────────────────────

  async loadStreakHistory(): Promise<StreakHistory> {
    const userId = await this.getUserId();
    const data = check(
      await this.supabase
        .from("streak_history")
        .select("*")
        .eq("user_id", userId),
      { silent: true },
    );

    const days: StreakHistory["days"] = {};
    if (data) {
      for (const row of data) {
        days[row.date_key] = {
          sessionCount: row.session_count,
          goalMet: row.goal_met,
          timestamp: row.recorded_at,
        };
      }
    }
    return { days };
  }

  async saveStreakHistory(history: StreakHistory): Promise<void> {
    const userId = await this.getUserId();
    const rows = Object.entries(history.days).map(([dateKey, day]) => ({
      user_id: userId,
      date_key: dateKey,
      session_count: day.sessionCount,
      goal_met: day.goalMet,
      recorded_at: day.timestamp,
    }));

    if (rows.length === 0) return;
    check(
      await this.supabase
        .from("streak_history")
        .upsert(rows, { onConflict: "user_id,date_key" })
    );
  }

  async recordDayCompletion(
    date: Date,
    sessionCount: number,
    goalMet: boolean,
  ): Promise<void> {
    const userId = await this.getUserId();
    const dateKey = formatDateLocal(date);

    check(
      await this.supabase.from("streak_history").upsert(
        {
          user_id: userId,
          date_key: dateKey,
          session_count: sessionCount,
          goal_met: goalMet,
          recorded_at: Date.now(),
        },
        { onConflict: "user_id,date_key" },
      )
    );
  }

  // ── Tasks ─────────────────────────────────────────────

  async loadTasks(): Promise<Task[]> {
    const userId = await this.getUserId();
    const data = check(
      await this.supabase
        .from("tasks")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true }),
      { silent: true },
    );

    if (!data) return [];

    return data.map((row) => mapTaskRow(row));
  }

  async saveTasks(tasks: Task[]): Promise<void> {
    if (tasks.length === 0) return;
    await withRetries(async () => {
      const userId = await this.getUserId();
      const rows = tasks.map((t) => taskToRow(t, userId));
      const result = await this.supabase.from("tasks").upsert(rows, { onConflict: "user_id,id" }).select("id");
      if (result.error) {
        console.error("[Foci] Supabase saveTasks error:", result.error.message, result.error.details, result.error.hint);
        throw new Error(result.error.message);
      }
    }, { label: "saveTasks" });
  }

  async saveTask(task: Task): Promise<void> {
    await withRetries(async () => {
      const userId = await this.getUserId();
      const row = taskToRow(task, userId);
      const result = await this.supabase.from("tasks").upsert(row, { onConflict: "user_id,id" }).select("id");
      if (result.error) {
        console.error("[Foci] Supabase saveTask error:", result.error.message, result.error.details, result.error.hint);
        throw new Error(result.error.message);
      }
    }, { label: "saveTask" });
  }

  async deleteTask(id: string): Promise<void> {
    const userId = await this.getUserId();
    check(
      await this.supabase
        .from("tasks")
        .delete()
        .eq("user_id", userId)
        .eq("id", id)
    );
  }

  async deleteTasks(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const userId = await this.getUserId();
    check(
      await this.supabase
        .from("tasks")
        .delete()
        .eq("user_id", userId)
        .in("id", ids)
    );
  }

  // ── Projects ──────────────────────────────────────────

  async loadProjects(): Promise<Project[]> {
    const userId = await this.getUserId();
    const data = check(
      await this.supabase
        .from("projects")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true }),
      { silent: true },
    );

    const projects: Project[] = data
      ? data.map((row) => ({
          id: row.id,
          name: row.name,
          ...(row.description ? { description: row.description } : {}),
          ...(row.color ? { color: row.color } : {}),
          ...(row.due_date ? { dueDate: row.due_date } : {}),
          ...(row.archived ? { archived: true } : {}),
          ...(row.sort_order != null ? { order: row.sort_order } : {}),
          ...(row.is_favorite ? { favorite: true } : {}),
          createdAt: row.created_at,
        }))
      : [];

    if (!projects.find((p) => p.id === DEFAULT_PROJECT.id)) {
      return [DEFAULT_PROJECT, ...projects];
    }
    return projects;
  }

  async saveProjects(projects: Project[]): Promise<void> {
    if (projects.length === 0) return;
    const userId = await this.getUserId();

    const rows = projects.map((p) => ({
      id: p.id,
      user_id: userId,
      name: p.name,
      description: p.description ?? null,
      color: p.color ?? null,
      due_date: p.dueDate ?? null,
      archived: p.archived ?? false,
      sort_order: p.order ?? null,
      is_favorite: p.favorite ?? false,
      created_at: p.createdAt,
    }));

    const result = await this.supabase.from("projects").upsert(rows, { onConflict: "user_id,id" }).select("id");
    if (result.error) {
      console.error("[Foci] Supabase saveProjects error:", result.error.message, result.error.details, result.error.hint);
      throw new Error(result.error.message);
    }
  }

  async deleteProject(id: string): Promise<void> {
    const userId = await this.getUserId();
    check(
      await this.supabase
        .from("projects")
        .delete()
        .eq("user_id", userId)
        .eq("id", id)
    );
  }

  async loadSelectedProjectId(): Promise<string> {
    const userId = await this.getUserId();
    const data = check(
      await this.supabase
        .from("user_preferences")
        .select("selected_project_id")
        .eq("user_id", userId)
        .maybeSingle(),
      { silent: true },
    );

    return data?.selected_project_id ?? ALL_PROJECTS_ID;
  }

  async saveSelectedProjectId(id: string): Promise<void> {
    const userId = await this.getUserId();
    check(
      await this.supabase.from("user_preferences").upsert({
        user_id: userId,
        selected_project_id: id,
      })
    );
  }

  async loadTaskViewPreferences(): Promise<TaskViewPreferences> {
    const userId = await this.getUserId();
    const data = check(
      await this.supabase
        .from("user_preferences")
        .select("default_task_view, last_task_view, task_view_explicit")
        .eq("user_id", userId)
        .maybeSingle(),
      { silent: true },
    );

    if (!data) return { ...DEFAULT_TASK_VIEW_PREFERENCES };

    return {
      defaultTaskView: isDefaultTaskView(data.default_task_view)
        ? data.default_task_view
        : DEFAULT_TASK_VIEW_PREFERENCES.defaultTaskView,
      lastTaskView: isDefaultTaskView(data.last_task_view) ? data.last_task_view : null,
      taskViewExplicit: data.task_view_explicit === true,
    };
  }

  async saveTaskViewPreferences(prefs: Partial<TaskViewPreferences>): Promise<void> {
    const userId = await this.getUserId();
    const current = await this.loadTaskViewPreferences();
    const merged = { ...current, ...prefs };

    check(
      await this.supabase.from("user_preferences").upsert({
        user_id: userId,
        default_task_view: merged.defaultTaskView,
        last_task_view: merged.lastTaskView,
        task_view_explicit: merged.taskViewExplicit,
      })
    );
  }

  async loadOneThing(): Promise<OneThingPreference | null> {
    const userId = await this.getUserId();
    const data = check(
      await this.supabase
        .from("user_preferences")
        .select("one_thing_task_id, one_thing_date")
        .eq("user_id", userId)
        .maybeSingle(),
      { silent: true },
    );

    if (!data?.one_thing_task_id || !data?.one_thing_date) return null;
    return { taskId: data.one_thing_task_id, date: data.one_thing_date };
  }

  async saveOneThing(pref: OneThingPreference | null): Promise<void> {
    const userId = await this.getUserId();
    check(
      await this.supabase.from("user_preferences").upsert({
        user_id: userId,
        one_thing_task_id: pref?.taskId ?? null,
        one_thing_date: pref?.date ?? null,
      })
    );
  }

  // ── Collaboration ─────────────────────────────────────

  async getProjectCollaborators(projectId: string): Promise<CollaboratorInfo[]> {
    const { data, error } = await this.supabase.rpc("list_my_project_collaborators", {
      p_project_id: projectId,
    });

    if (!error && data) {
      return data.map((row: {
        collaborator_id: string;
        role: string;
        created_at: string;
        email: string | null;
        display_name: string | null;
        avatar_url: string | null;
      }) => ({
        userId: row.collaborator_id,
        email: row.email ?? "",
        displayName: row.display_name ?? undefined,
        avatarUrl: row.avatar_url ?? undefined,
        role: row.role as CollaboratorRole,
        addedAt: row.created_at,
      }));
    }

    if (error) {
      console.warn(
        "[Foci] list_my_project_collaborators RPC failed, falling back:",
        error.message,
      );
    }

    const userId = await this.getUserId();

    // Prefer the canonical FK from 20260514000000. Fall back without embed if
    // PostgREST can't resolve the relationship (duplicate/legacy FK names).
    const embedded = await this.supabase
      .from("project_collaborators")
      .select(`
        collaborator_id,
        role,
        created_at,
        user_profiles!project_collaborators_collaborator_id_fkey (
          email,
          display_name,
          avatar_url
        )
      `)
      .eq("project_id", projectId)
      .eq("owner_id", userId);

    if (!embedded.error && embedded.data) {
      const mapped = embedded.data.map((row) => {
        const profile = Array.isArray(row.user_profiles) ? row.user_profiles[0] : row.user_profiles;
        return {
          userId: row.collaborator_id,
          email: profile?.email ?? "",
          displayName: profile?.display_name ?? undefined,
          avatarUrl: profile?.avatar_url ?? undefined,
          role: row.role as CollaboratorRole,
          addedAt: row.created_at,
        };
      });
      if (mapped.every((c) => c.email)) return mapped;
      const missing = mapped.filter((c) => !c.email).map((c) => c.userId);
      if (missing.length > 0) {
        const { data: profiles } = await this.supabase
          .from("user_profiles")
          .select("user_id, email, display_name, avatar_url")
          .in("user_id", missing);
        const byId = new Map((profiles ?? []).map((p) => [p.user_id, p] as const));
        return mapped.map((c) => {
          if (c.email) return c;
          const profile = byId.get(c.userId);
          return {
            ...c,
            email: profile?.email ?? c.email,
            displayName: profile?.display_name ?? c.displayName,
            avatarUrl: profile?.avatar_url ?? c.avatarUrl,
          };
        });
      }
      return mapped;
    }

    if (embedded.error) {
      console.warn(
        "[Foci] getProjectCollaborators embed failed, falling back:",
        embedded.error.message,
      );
    }

    const { data: rows, error: rowsError } = await this.supabase
      .from("project_collaborators")
      .select("collaborator_id, role, created_at")
      .eq("project_id", projectId)
      .eq("owner_id", userId);

    if (rowsError) {
      console.error("[Foci] getProjectCollaborators error:", rowsError);
      console.error("[Foci] getProjectCollaborators error details:", JSON.stringify(rowsError, null, 2));
      throw new Error(rowsError.message);
    }

    if (!rows || rows.length === 0) return [];

    const ids = rows.map((row) => row.collaborator_id);
    const { data: profiles } = await this.supabase
      .from("user_profiles")
      .select("user_id, email, display_name, avatar_url")
      .in("user_id", ids);

    const byId = new Map(
      (profiles ?? []).map((p) => [p.user_id, p] as const),
    );

    return rows.map((row) => {
      const profile = byId.get(row.collaborator_id);
      return {
        userId: row.collaborator_id,
        email: profile?.email ?? "",
        displayName: profile?.display_name ?? undefined,
        avatarUrl: profile?.avatar_url ?? undefined,
        role: row.role as CollaboratorRole,
        addedAt: row.created_at,
      };
    });
  }

  async inviteCollaborator(projectId: string, email: string, role: CollaboratorRole): Promise<void> {
    const userId = await this.getUserId();

    const { data: inviteeId } = await this.supabase.rpc("resolve_invitee_id", {
      invitee_email: email.toLowerCase(),
    });

    const { data: project } = await this.supabase
      .from("projects")
      .select("name")
      .eq("id", projectId)
      .eq("user_id", userId)
      .maybeSingle();

    const { error } = await this.supabase
      .from("collaboration_invites")
      .insert({
        project_id: projectId,
        owner_id: userId,
        invitee_email: email.toLowerCase(),
        invitee_id: inviteeId ?? null,
        project_name: project?.name ?? null,
        role,
      });
      
    if (error) {
      if (error.code === "23505") { // unique violation
        throw new Error("An invite has already been sent to this email");
      }
      console.error("[Foci] inviteCollaborator error:", error);
      throw new Error(error.message);
    }
  }

  async removeCollaborator(projectId: string, collaboratorId: string): Promise<void> {
    const userId = await this.getUserId();
    
    const { error } = await this.supabase
      .from("project_collaborators")
      .delete()
      .eq("project_id", projectId)
      .eq("owner_id", userId)
      .eq("collaborator_id", collaboratorId);
      
    if (error) {
      console.error("[Foci] removeCollaborator error:", error);
      throw new Error(error.message);
    }
  }

  async updateCollaboratorRole(projectId: string, collaboratorId: string, role: CollaboratorRole): Promise<void> {
    const userId = await this.getUserId();
    
    const { error } = await this.supabase
      .from("project_collaborators")
      .update({ role })
      .eq("project_id", projectId)
      .eq("owner_id", userId)
      .eq("collaborator_id", collaboratorId);
      
    if (error) {
      console.error("[Foci] updateCollaboratorRole error:", error);
      throw new Error(error.message);
    }
  }

  async getSentInvites(projectId: string): Promise<CollaborationInvite[]> {
    const userId = await this.getUserId();
    
    const { data, error } = await this.supabase
      .from("collaboration_invites")
      .select(`
        id,
        project_id,
        invitee_email,
        role,
        status,
        created_at,
        expires_at,
        projects!collaboration_invites_owner_id_project_id_fkey (
          name
        )
      `)
      .eq("project_id", projectId)
      .eq("owner_id", userId)
      .eq("status", "pending");
      
    if (error) {
      console.error("[Foci] getSentInvites error:", error);
      throw new Error(error.message);
    }
    
    if (!data) return [];
    
    // Get current user's email for owner info
    const { data: profile } = await this.supabase
      .from("user_profiles")
      .select("email, display_name")
      .eq("user_id", userId)
      .maybeSingle();
    
    return data.map((row) => {
      const project = Array.isArray(row.projects) ? row.projects[0] : row.projects;
      return {
        id: row.id,
        projectId: row.project_id,
        projectName: project?.name ?? "Unknown Project",
        ownerEmail: profile?.email ?? "",
        ownerName: profile?.display_name ?? undefined,
        ownerId: userId,
        inviteeEmail: row.invitee_email ?? undefined,
        role: row.role as CollaboratorRole,
        status: row.status as "pending" | "accepted" | "declined" | "expired",
        createdAt: row.created_at,
        expiresAt: row.expires_at,
      };
    });
  }

  async cancelInvite(inviteId: string): Promise<void> {
    const userId = await this.getUserId();
    
    const { error } = await this.supabase
      .from("collaboration_invites")
      .delete()
      .eq("id", inviteId)
      .eq("owner_id", userId);
      
    if (error) {
      console.error("[Foci] cancelInvite error:", error);
      throw new Error(error.message);
    }
  }

  async getReceivedInvites(): Promise<CollaborationInvite[]> {
    const { data, error } = await this.supabase.rpc("list_my_received_project_invites");

    if (!error && data) {
      return data.map((row: {
        id: string;
        project_id: string;
        project_name: string | null;
        owner_id: string;
        owner_email: string | null;
        owner_display_name: string | null;
        role: string;
        status: string;
        created_at: string;
        expires_at: string;
      }) => ({
        id: row.id,
        projectId: row.project_id,
        projectName: row.project_name || "Project",
        ownerEmail: row.owner_email ?? "",
        ownerName: row.owner_display_name ?? undefined,
        ownerId: row.owner_id,
        role: row.role as CollaboratorRole,
        status: row.status as "pending" | "accepted" | "declined" | "expired",
        createdAt: row.created_at,
        expiresAt: row.expires_at,
      }));
    }

    if (error) {
      console.warn(
        "[Foci] list_my_received_project_invites RPC failed, falling back:",
        error.message,
      );
    }

    const userId = await this.getUserId();

    // Prefer auth email (matches account invites); fall back to profile email.
    const { data: { user } } = await this.supabase.auth.getUser();
    const { data: profile } = await this.supabase
      .from("user_profiles")
      .select("email")
      .eq("user_id", userId)
      .maybeSingle();

    const userEmail = (user?.email ?? profile?.email)?.toLowerCase() ?? null;

    // Run two separate queries (by invitee_id and by invitee_email) to avoid
    // interpolating email into a PostgREST filter string, which could be
    // manipulated if the email contains filter-delimiter characters.
    const selectClause = `
        id,
        project_id,
        project_name,
        owner_id,
        role,
        status,
        created_at,
        expires_at,
        projects!collaboration_invites_owner_id_project_id_fkey (
          name
        ),
        user_profiles!collaboration_invites_owner_id_fkey (
          email,
          display_name
        )
      `;

    const [{ data: byId, error: err1 }, { data: byEmail, error: err2 }] = await Promise.all([
      this.supabase.from("collaboration_invites").select(selectClause)
        .eq("invitee_id", userId).eq("status", "pending"),
      ...(userEmail
        ? [this.supabase.from("collaboration_invites").select(selectClause)
            .eq("invitee_email", userEmail).eq("status", "pending")]
        : [Promise.resolve({ data: [], error: null })]
      ),
    ]);

    if (err1) { console.error("[Foci] getReceivedInvites (byId) error:", err1); throw new Error(err1.message); }
    if (err2) { console.error("[Foci] getReceivedInvites (byEmail) error:", err2); throw new Error(err2.message); }

    // Merge and deduplicate by invite id
    const seen = new Set<string>();
    const rows = [...(byId ?? []), ...(byEmail ?? [])].filter((row) => {
      if (seen.has(row.id)) return false;
      seen.add(row.id);
      return true;
    });
    
    // Filter out expired invites
    const now = new Date();
    return rows
      .filter((row: { expires_at: string }) => new Date(row.expires_at) > now)
      .map((row) => {
        const project = Array.isArray(row.projects) ? row.projects[0] : row.projects;
        const ownerProfile = Array.isArray(row.user_profiles) ? row.user_profiles[0] : row.user_profiles;
        return {
          id: row.id,
          projectId: row.project_id,
          projectName: row.project_name || project?.name || "Project",
          ownerEmail: ownerProfile?.email ?? "",
          ownerName: ownerProfile?.display_name ?? undefined,
          ownerId: row.owner_id,
          role: row.role as CollaboratorRole,
          status: row.status as "pending" | "accepted" | "declined" | "expired",
          createdAt: row.created_at,
          expiresAt: row.expires_at,
        };
      });
  }

  async acceptInvite(inviteId: string): Promise<void> {
    const { error } = await this.supabase.rpc("accept_collaboration_invite", {
      invite_id: inviteId,
    });

    if (error) {
      console.error("[Foci] acceptInvite error:", error);
      throw new Error(error.message);
    }
  }

  async declineInvite(inviteId: string): Promise<void> {
    const userId = await this.getUserId();

    // Fetch the invite first so we can verify ownership in application code
    // rather than interpolating email into a PostgREST filter string.
    const { data: invite, error: fetchError } = await this.supabase
      .from("collaboration_invites")
      .select("invitee_id, invitee_email")
      .eq("id", inviteId)
      .maybeSingle();

    if (fetchError || !invite) throw new Error("Invite not found");

    const { data: { user } } = await this.supabase.auth.getUser();
    const { data: profile } = await this.supabase
      .from("user_profiles")
      .select("email")
      .eq("user_id", userId)
      .maybeSingle();

    const callerEmail = (user?.email ?? profile?.email)?.toLowerCase() ?? null;
    const isRecipient =
      invite.invitee_id === userId ||
      (invite.invitee_email != null &&
        callerEmail != null &&
        invite.invitee_email.toLowerCase() === callerEmail);

    if (!isRecipient) throw new Error("Unauthorized");

    const { error } = await this.supabase
      .from("collaboration_invites")
      .update({ status: "declined" })
      .eq("id", inviteId);
      
    if (error) {
      console.error("[Foci] declineInvite error:", error);
      throw new Error(error.message);
    }
  }

  async getSharedProjects(): Promise<SharedProject[]> {
    const userId = await this.getUserId();
    
    // Get project-level shared projects
    const { data: projectData, error: projectError } = await this.supabase
      .from("project_collaborators")
      .select(`
        role,
        projects!project_collaborators_owner_id_project_id_fkey (
          id,
          user_id,
          name,
          description,
          color,
          due_date,
          archived,
          sort_order,
          created_at
        ),
        user_profiles!project_collaborators_owner_id_fkey (
          email,
          display_name
        )
      `)
      .eq("collaborator_id", userId);
      
    if (projectError) {
      console.error("[Foci] getSharedProjects (project-level) error:", projectError);
      throw new Error(projectError.message);
    }
    
    // Get account-level shared projects (all projects from shared accounts)
    const { data: accountData, error: accountError } = await this.supabase
      .from("account_collaborators")
      .select(`
        role,
        owner_id,
        user_profiles!account_collaborators_owner_id_fkey (
          email,
          display_name
        )
      `)
      .eq("collaborator_id", userId);
      
    if (accountError) {
      console.error("[Foci] getSharedProjects (account-level) error:", accountError);
      throw new Error(accountError.message);
    }
    
    const result: SharedProject[] = [];
    
    // Process project-level shared projects
    if (projectData) {
      for (const row of projectData) {
        if (!row.projects) continue;
        const project = Array.isArray(row.projects) ? row.projects[0] : row.projects;
        const profile = Array.isArray(row.user_profiles) ? row.user_profiles[0] : row.user_profiles;
        if (!project) continue;
        
        result.push({
          id: project.id,
          name: project.name,
          description: project.description ?? undefined,
          color: project.color ?? undefined,
          dueDate: project.due_date ?? undefined,
          archived: project.archived ?? undefined,
          order: project.sort_order ?? undefined,
          createdAt: project.created_at,
          _isShared: true as const,
          _ownerId: project.user_id,
          _ownerEmail: profile?.email ?? "",
          _ownerName: profile?.display_name ?? undefined,
          _myRole: row.role as CollaboratorRole,
          _shareSource: "project",
        });
      }
    }
    
    // Process account-level shared projects
    if (accountData) {
      for (const accountRow of accountData) {
        const profile = Array.isArray(accountRow.user_profiles) ? accountRow.user_profiles[0] : accountRow.user_profiles;
        
        // Fetch all projects for this owner
        const { data: ownerProjects, error: ownerError } = await this.supabase
          .from("projects")
          .select("*")
          .eq("user_id", accountRow.owner_id);
          
        if (ownerError) {
          console.error("[Foci] getSharedProjects (fetch owner projects) error:", ownerError);
          continue;
        }
        
        if (ownerProjects) {
          for (const project of ownerProjects) {
            // Skip if already added via project-level sharing
            if (result.some((p) => p.id === project.id && p._ownerId === project.user_id)) {
              continue;
            }
            
            result.push({
              id: project.id,
              name: project.name,
              description: project.description ?? undefined,
              color: project.color ?? undefined,
              dueDate: project.due_date ?? undefined,
              archived: project.archived ?? undefined,
              order: project.sort_order ?? undefined,
              createdAt: project.created_at,
              _isShared: true as const,
              _ownerId: project.user_id,
              _ownerEmail: profile?.email ?? "",
              _ownerName: profile?.display_name ?? undefined,
              _myRole: accountRow.role as CollaboratorRole,
              _shareSource: "account",
            });
          }
        }
      }
    }
    
    return result;
  }

  async loadSharedProjectTasks(projectId: string, ownerId: string): Promise<Task[]> {
    const { data, error } = await this.supabase
      .from("tasks")
      .select("*")
      .eq("user_id", ownerId)
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });
      
    if (error) {
      console.error("[Foci] loadSharedProjectTasks error:", error);
      throw new Error(error.message);
    }
    
    if (!data) return [];
    
    return data.map((row) => mapTaskRow(row));
  }

  async updateSharedTask(task: Task, ownerId: string): Promise<void> {
    const row = taskToRow(task, ownerId);
    
    const { error } = await this.supabase
      .from("tasks")
      .update(row)
      .eq("user_id", ownerId)
      .eq("id", task.id);
      
    if (error) {
      console.error("[Foci] updateSharedTask error:", error);
      throw new Error(error.message);
    }
  }

  async leaveProject(projectId: string, ownerId: string): Promise<void> {
    const userId = await this.getUserId();
    
    const { data, error } = await this.supabase
      .from("project_collaborators")
      .delete()
      .eq("project_id", projectId)
      .eq("owner_id", ownerId)
      .eq("collaborator_id", userId)
      .select("id");
      
    if (error) {
      console.error("[Foci] leaveProject error:", error);
      throw new Error(error.message);
    }

    if (!data || data.length === 0) {
      throw new Error("Could not leave project. You may have account-level access instead.");
    }
  }

  async leaveSharedAccount(ownerId: string): Promise<void> {
    const userId = await this.getUserId();

    const { data, error } = await this.supabase
      .from("account_collaborators")
      .delete()
      .eq("owner_id", ownerId)
      .eq("collaborator_id", userId)
      .select("id");

    if (error) {
      console.error("[Foci] leaveSharedAccount error:", error);
      throw new Error(error.message);
    }

    if (!data || data.length === 0) {
      throw new Error("Could not leave shared account");
    }
  }

  // ── Account-Level Sharing ─────────────────────────────────────

  async getAccountCollaborators(): Promise<AccountCollaboratorInfo[]> {
    const { data, error } = await this.supabase.rpc("list_my_account_collaborators");

    if (!error && data) {
      return data.map((row: {
        collaborator_id: string;
        role: string;
        created_at: string;
        email: string | null;
        display_name: string | null;
        avatar_url: string | null;
      }) => ({
        userId: row.collaborator_id,
        email: row.email ?? "",
        displayName: row.display_name ?? undefined,
        avatarUrl: row.avatar_url ?? undefined,
        role: row.role as CollaboratorRole,
        addedAt: row.created_at,
      }));
    }

    if (error) {
      console.warn(
        "[Foci] list_my_account_collaborators RPC failed, falling back:",
        error.message,
      );
    }

    const userId = await this.getUserId();

    // Prefer the canonical FK from 20260514000000. Fall back without embed if
    // PostgREST can't resolve the relationship (duplicate/legacy FK names).
    const embedded = await this.supabase
      .from("account_collaborators")
      .select(`
        collaborator_id,
        role,
        created_at,
        user_profiles!account_collaborators_collaborator_id_fkey (
          email,
          display_name,
          avatar_url
        )
      `)
      .eq("owner_id", userId);

    if (!embedded.error && embedded.data) {
      const mapped = embedded.data.map((row) => {
        const profile = Array.isArray(row.user_profiles) ? row.user_profiles[0] : row.user_profiles;
        return {
          userId: row.collaborator_id,
          email: profile?.email ?? "",
          displayName: profile?.display_name ?? undefined,
          avatarUrl: profile?.avatar_url ?? undefined,
          role: row.role as CollaboratorRole,
          addedAt: row.created_at,
        };
      });
      // Embed can "succeed" with null nested profiles under RLS — fill gaps.
      if (mapped.every((c) => c.email)) return mapped;
      const missing = mapped.filter((c) => !c.email).map((c) => c.userId);
      if (missing.length > 0) {
        const { data: profiles } = await this.supabase
          .from("user_profiles")
          .select("user_id, email, display_name, avatar_url")
          .in("user_id", missing);
        const byId = new Map((profiles ?? []).map((p) => [p.user_id, p] as const));
        return mapped.map((c) => {
          if (c.email) return c;
          const profile = byId.get(c.userId);
          return {
            ...c,
            email: profile?.email ?? c.email,
            displayName: profile?.display_name ?? c.displayName,
            avatarUrl: profile?.avatar_url ?? c.avatarUrl,
          };
        });
      }
      return mapped;
    }

    if (embedded.error) {
      console.warn(
        "[Foci] getAccountCollaborators embed failed, falling back:",
        embedded.error.message,
      );
    }

    const { data: rows, error: rowsError } = await this.supabase
      .from("account_collaborators")
      .select("collaborator_id, role, created_at")
      .eq("owner_id", userId);

    if (rowsError) {
      console.error("[Foci] getAccountCollaborators error:", rowsError);
      console.error("[Foci] getAccountCollaborators error details:", JSON.stringify(rowsError, null, 2));
      throw new Error(rowsError.message);
    }

    if (!rows || rows.length === 0) return [];

    const ids = rows.map((row) => row.collaborator_id);
    const { data: profiles } = await this.supabase
      .from("user_profiles")
      .select("user_id, email, display_name, avatar_url")
      .in("user_id", ids);

    const byId = new Map(
      (profiles ?? []).map((p) => [p.user_id, p] as const),
    );

    return rows.map((row) => {
      const profile = byId.get(row.collaborator_id);
      return {
        userId: row.collaborator_id,
        email: profile?.email ?? "",
        displayName: profile?.display_name ?? undefined,
        avatarUrl: profile?.avatar_url ?? undefined,
        role: row.role as CollaboratorRole,
        addedAt: row.created_at,
      };
    });
  }

  async inviteAccountCollaborator(email: string, role: CollaboratorRole): Promise<void> {
    const userId = await this.getUserId();
    const normalizedEmail = email.toLowerCase();

    const { data: inviteeId } = await this.supabase.rpc("resolve_invitee_id", {
      invitee_email: normalizedEmail,
    });

    if (inviteeId) {
      if (inviteeId === userId) {
        throw new Error("You can't share your account with yourself");
      }

      const { data: existing } = await this.supabase
        .from("account_collaborators")
        .select("id")
        .eq("owner_id", userId)
        .eq("collaborator_id", inviteeId)
        .maybeSingle();

      if (existing) {
        throw new Error("This user already has access to your account");
      }
    }

    // Always create a pending invite so the recipient can accept (existing users
    // included). Previously we auto-inserted collaborators for known emails.
    const { error } = await this.supabase
      .from("account_invites")
      .insert({
        owner_id: userId,
        invitee_email: normalizedEmail,
        invitee_id: inviteeId ?? null,
        role,
      });
      
    if (error) {
      if (error.code === "23505") {
        throw new Error("An invite has already been sent to this email");
      }
      console.error("[Foci] inviteAccountCollaborator error:", error);
      throw new Error(error.message);
    }
  }

  async removeAccountCollaborator(collaboratorId: string): Promise<void> {
    const userId = await this.getUserId();
    
    const { error } = await this.supabase
      .from("account_collaborators")
      .delete()
      .eq("owner_id", userId)
      .eq("collaborator_id", collaboratorId);
      
    if (error) {
      console.error("[Foci] removeAccountCollaborator error:", error);
      throw new Error(error.message);
    }
  }

  async updateAccountCollaboratorRole(collaboratorId: string, role: CollaboratorRole): Promise<void> {
    const userId = await this.getUserId();
    
    const { error } = await this.supabase
      .from("account_collaborators")
      .update({ role })
      .eq("owner_id", userId)
      .eq("collaborator_id", collaboratorId);
      
    if (error) {
      console.error("[Foci] updateAccountCollaboratorRole error:", error);
      throw new Error(error.message);
    }
  }

  async getSentAccountInvites(): Promise<AccountInvite[]> {
    const userId = await this.getUserId();
    
    const { data, error } = await this.supabase
      .from("account_invites")
      .select("*")
      .eq("owner_id", userId)
      .eq("status", "pending");
      
    if (error) {
      console.error("[Foci] getSentAccountInvites error:", error);
      throw new Error(error.message);
    }
    
    if (!data) return [];
    
    // Get current user's email for owner info
    const { data: profile } = await this.supabase
      .from("user_profiles")
      .select("email, display_name")
      .eq("user_id", userId)
      .maybeSingle();
    
    return data.map((row) => ({
      id: row.id,
      ownerEmail: profile?.email ?? "",
      ownerName: profile?.display_name ?? undefined,
      ownerId: userId,
      inviteeEmail: row.invitee_email ?? undefined,
      role: row.role as CollaboratorRole,
      status: row.status as "pending" | "accepted" | "declined" | "expired",
      createdAt: row.created_at,
      expiresAt: row.expires_at,
    }));
  }

  async cancelAccountInvite(inviteId: string): Promise<void> {
    const userId = await this.getUserId();
    
    const { error } = await this.supabase
      .from("account_invites")
      .delete()
      .eq("id", inviteId)
      .eq("owner_id", userId);
      
    if (error) {
      console.error("[Foci] cancelAccountInvite error:", error);
      throw new Error(error.message);
    }
  }

  async getReceivedAccountInvites(): Promise<AccountInvite[]> {
    const userId = await this.getUserId();
    
    // Get user email
    const { data: { user } } = await this.supabase.auth.getUser();
    const userEmail = user?.email?.toLowerCase();
    
    // Run two separate queries (by invitee_id and by invitee_email) to avoid
    // interpolating email into a PostgREST filter string.
    const selectClause = `
        id,
        owner_id,
        role,
        status,
        created_at,
        expires_at,
        user_profiles!account_invites_owner_id_fkey (
          email,
          display_name
        )
      `;

    const [{ data: byId, error: err1 }, { data: byEmail, error: err2 }] = await Promise.all([
      this.supabase.from("account_invites").select(selectClause)
        .eq("invitee_id", userId).eq("status", "pending"),
      ...(userEmail
        ? [this.supabase.from("account_invites").select(selectClause)
            .eq("invitee_email", userEmail).eq("status", "pending")]
        : [Promise.resolve({ data: [], error: null })]
      ),
    ]);

    if (err1) { console.error("[Foci] getReceivedAccountInvites (byId) error:", err1); throw new Error(err1.message); }
    if (err2) { console.error("[Foci] getReceivedAccountInvites (byEmail) error:", err2); throw new Error(err2.message); }

    // Merge and deduplicate by invite id
    const seen = new Set<string>();
    const data = [...(byId ?? []), ...(byEmail ?? [])].filter((row) => {
      if (seen.has(row.id)) return false;
      seen.add(row.id);
      return true;
    });
    
    // Filter out expired invites
    const now = new Date();
    return data
      .filter((row: { expires_at: string }) => new Date(row.expires_at) > now)
      .map((row) => {
        const profile = Array.isArray(row.user_profiles) ? row.user_profiles[0] : row.user_profiles;
        return {
          id: row.id,
          ownerEmail: profile?.email ?? "",
          ownerName: profile?.display_name ?? undefined,
          ownerId: row.owner_id,
          role: row.role as CollaboratorRole,
          status: row.status as "pending" | "accepted" | "declined" | "expired",
          createdAt: row.created_at,
          expiresAt: row.expires_at,
        };
      });
  }

  async acceptAccountInvite(inviteId: string): Promise<void> {
    const { error } = await this.supabase.rpc("accept_account_invite", {
      invite_id: inviteId,
    });

    if (error) {
      console.error("[Foci] acceptAccountInvite error:", error);
      throw new Error(error.message);
    }
  }

  async declineAccountInvite(inviteId: string): Promise<void> {
    const userId = await this.getUserId();

    const { data: invite, error: fetchError } = await this.supabase
      .from("account_invites")
      .select("invitee_id, invitee_email")
      .eq("id", inviteId)
      .maybeSingle();

    if (fetchError || !invite) throw new Error("Invite not found");

    const { data: { user } } = await this.supabase.auth.getUser();
    const { data: profile } = await this.supabase
      .from("user_profiles")
      .select("email")
      .eq("user_id", userId)
      .maybeSingle();

    const callerEmail = (user?.email ?? profile?.email)?.toLowerCase() ?? null;
    const isRecipient =
      invite.invitee_id === userId ||
      (invite.invitee_email != null &&
        callerEmail != null &&
        invite.invitee_email.toLowerCase() === callerEmail);

    if (!isRecipient) throw new Error("Unauthorized");

    const { error } = await this.supabase
      .from("account_invites")
      .update({
        status: "declined",
        invitee_id: userId,
      })
      .eq("id", inviteId);

    if (error) {
      console.error("[Foci] declineAccountInvite error:", error);
      throw new Error(error.message);
    }
  }

  async getSharedAccounts(): Promise<{ ownerId: string; ownerEmail: string; ownerName?: string; role: CollaboratorRole }[]> {
    const userId = await this.getUserId();
    
    const { data, error } = await this.supabase
      .from("account_collaborators")
      .select(`
        owner_id,
        role,
        user_profiles!account_collaborators_owner_id_fkey (
          email,
          display_name
        )
      `)
      .eq("collaborator_id", userId);
      
    if (error) {
      console.error("[Foci] getSharedAccounts error:", error);
      throw new Error(error.message);
    }
    
    if (!data) return [];
    
    return data.map((row) => {
      const profile = Array.isArray(row.user_profiles) ? row.user_profiles[0] : row.user_profiles;
      return {
        ownerId: row.owner_id,
        ownerEmail: profile?.email ?? "",
        ownerName: profile?.display_name ?? undefined,
        role: row.role as CollaboratorRole,
      };
    });
  }
}
