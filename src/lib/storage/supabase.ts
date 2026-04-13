import type { SupabaseClient } from "@supabase/supabase-js";
import { showToastGlobal } from "@/components/ToastProvider";
import {
  Settings,
  DailyGoalData,
  StreakHistory,
  Task,
  Project,
  DEFAULT_SETTINGS,
  DEFAULT_PROJECT,
  TODAY_FILTER_ID,
} from "../types";
import type { StorageAdapter, CollaboratorInfo, CollaborationInvite, SharedProject, CollaboratorRole, AccountCollaboratorInfo, AccountInvite } from "./types";
import { getToday, getYesterday, formatDateLocal } from "../dates";

/** Migrate old toDateString() format ("Wed Mar 12 2026") to ISO ("2026-03-12"). */
function migrateDate(dateStr: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) return formatDateLocal(parsed);
  return getToday();
}

/** Throw if a Supabase response has an error. */
function check<T>(result: { data: T; error: { message: string } | null }): T {
  if (result.error) {
    showToastGlobal(`Sync error: ${result.error.message}`, "error");
    throw new Error(result.error.message);
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
        .maybeSingle()
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
        .maybeSingle()
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
        .eq("user_id", userId)
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
        .order("created_at", { ascending: true })
    );

    if (!data) return [];

    return data.map((row) => ({
      id: row.id,
      title: row.title,
      completed: row.completed,
      sessions: row.sessions,
      timeSpent: row.time_spent,
      createdAt: row.created_at,
      projectId: row.project_id,
      subtasks: row.subtasks ?? [],
      ...(row.description ? { description: row.description } : {}),
      ...(row.due_date ? { dueDate: row.due_date } : {}),
      ...(row.order !== null && row.order !== undefined ? { order: row.order } : {}),
      ...(row.archived_at ? { archivedAt: row.archived_at } : {}),
      ...(row.recurrence ? { recurrence: row.recurrence } : {}),
    }));
  }

  async saveTasks(tasks: Task[]): Promise<void> {
    if (tasks.length === 0) return;
    const userId = await this.getUserId();

    const rows = tasks.map((t) => ({
      id: t.id,
      user_id: userId,
      title: t.title,
      completed: t.completed,
      sessions: t.sessions,
      time_spent: t.timeSpent,
      created_at: t.createdAt,
      project_id: t.projectId,
      subtasks: t.subtasks ?? [],
      description: t.description ?? null,
      due_date: t.dueDate ?? null,
      "order": t.order ?? null,
      archived_at: t.archivedAt ?? null,
      recurrence: t.recurrence ?? null,
    }));

    const result = await this.supabase.from("tasks").upsert(rows, { onConflict: "user_id,id" }).select("id");
    if (result.error) {
      console.error("[Foci] Supabase saveTasks error:", result.error.message, result.error.details, result.error.hint);
      throw new Error(result.error.message);
    }
  }

  async saveTask(task: Task): Promise<void> {
    const userId = await this.getUserId();
    const row = {
      id: task.id,
      user_id: userId,
      title: task.title,
      completed: task.completed,
      sessions: task.sessions,
      time_spent: task.timeSpent,
      created_at: task.createdAt,
      project_id: task.projectId,
      subtasks: task.subtasks ?? [],
      description: task.description ?? null,
      due_date: task.dueDate ?? null,
      "order": task.order ?? null,
      archived_at: task.archivedAt ?? null,
      recurrence: task.recurrence ?? null,
    };
    const result = await this.supabase.from("tasks").upsert(row, { onConflict: "user_id,id" }).select("id");
    if (result.error) {
      console.error("[Foci] Supabase saveTask error:", result.error.message, result.error.details, result.error.hint);
      throw new Error(result.error.message);
    }
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
        .order("created_at", { ascending: true })
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
        .maybeSingle()
    );

    return data?.selected_project_id ?? TODAY_FILTER_ID;
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

  // ── Collaboration ─────────────────────────────────────

  async getProjectCollaborators(projectId: string): Promise<CollaboratorInfo[]> {
    const userId = await this.getUserId();
    
    const { data, error } = await this.supabase
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
      
    if (error) {
      console.error("[Foci] getProjectCollaborators error:", error);
      throw new Error(error.message);
    }
    
    if (!data) return [];
    
    return data.map((row) => {
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
  }

  async inviteCollaborator(projectId: string, email: string, role: CollaboratorRole): Promise<void> {
    const userId = await this.getUserId();
    
    // Check if user exists
    const { data: existingUser } = await this.supabase
      .from("user_profiles")
      .select("user_id")
      .ilike("email", email)
      .maybeSingle();
    
    const { error } = await this.supabase
      .from("collaboration_invites")
      .insert({
        project_id: projectId,
        owner_id: userId,
        invitee_email: email.toLowerCase(),
        invitee_id: existingUser?.user_id ?? null,
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
      .single();
    
    return data.map((row) => {
      const project = Array.isArray(row.projects) ? row.projects[0] : row.projects;
      return {
        id: row.id,
        projectId: row.project_id,
        projectName: project?.name ?? "Unknown Project",
        ownerEmail: profile?.email ?? "",
        ownerName: profile?.display_name ?? undefined,
        ownerId: userId,
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
    const userId = await this.getUserId();
    
    // Get user's email to match invites
    const { data: profile } = await this.supabase
      .from("user_profiles")
      .select("email")
      .eq("user_id", userId)
      .single();
      
    if (!profile) return [];
    
    const { data, error } = await this.supabase
      .from("collaboration_invites")
      .select(`
        id,
        project_id,
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
      `)
      .or(`invitee_id.eq.${userId},invitee_email.ilike.${profile.email}`)
      .eq("status", "pending");
      
    if (error) {
      console.error("[Foci] getReceivedInvites error:", error);
      throw new Error(error.message);
    }
    
    if (!data) return [];
    
    // Filter out expired invites
    const now = new Date();
    return data
      .filter((row: { expires_at: string }) => new Date(row.expires_at) > now)
      .map((row) => {
        const project = Array.isArray(row.projects) ? row.projects[0] : row.projects;
        const profile = Array.isArray(row.user_profiles) ? row.user_profiles[0] : row.user_profiles;
        return {
          id: row.id,
          projectId: row.project_id,
          projectName: project?.name ?? "Unknown Project",
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

  async acceptInvite(inviteId: string): Promise<void> {
    const userId = await this.getUserId();
    
    // Get invite details
    const { data: invite, error: fetchError } = await this.supabase
      .from("collaboration_invites")
      .select("*")
      .eq("id", inviteId)
      .single();
      
    if (fetchError || !invite) {
      throw new Error("Invite not found");
    }
    if (invite.status !== "pending") {
      throw new Error("Invite is no longer valid");
    }
    if (new Date(invite.expires_at) < new Date()) {
      throw new Error("Invite has expired");
    }
    
    // Create collaborator entry
    const { error: insertError } = await this.supabase
      .from("project_collaborators")
      .insert({
        project_id: invite.project_id,
        owner_id: invite.owner_id,
        collaborator_id: userId,
        role: invite.role,
      });
      
    if (insertError) {
      console.error("[Foci] acceptInvite insert error:", insertError);
      throw new Error(insertError.message);
    }
    
    // Update invite status
    const { error: updateError } = await this.supabase
      .from("collaboration_invites")
      .update({ 
        status: "accepted", 
        accepted_at: new Date().toISOString() 
      })
      .eq("id", inviteId);
      
    if (updateError) {
      console.error("[Foci] acceptInvite update error:", updateError);
    }
  }

  async declineInvite(inviteId: string): Promise<void> {
    const userId = await this.getUserId();
    
    // Get user's email
    const { data: profile } = await this.supabase
      .from("user_profiles")
      .select("email")
      .eq("user_id", userId)
      .single();
      
    const { error } = await this.supabase
      .from("collaboration_invites")
      .update({ status: "declined" })
      .eq("id", inviteId)
      .or(`invitee_id.eq.${userId},invitee_email.ilike.${profile?.email ?? ""}`);
      
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
    
    return data.map((row) => ({
      id: row.id,
      title: row.title,
      completed: row.completed,
      sessions: row.sessions,
      timeSpent: row.time_spent,
      createdAt: row.created_at,
      projectId: row.project_id,
      subtasks: row.subtasks ?? [],
      ...(row.description ? { description: row.description } : {}),
      ...(row.due_date ? { dueDate: row.due_date } : {}),
      ...(row.order !== null && row.order !== undefined ? { order: row.order } : {}),
      ...(row.archived_at ? { archivedAt: row.archived_at } : {}),
      ...(row.recurrence ? { recurrence: row.recurrence } : {}),
    }));
  }

  async updateSharedTask(task: Task, ownerId: string): Promise<void> {
    const row = {
      id: task.id,
      user_id: ownerId,
      title: task.title,
      completed: task.completed,
      sessions: task.sessions,
      time_spent: task.timeSpent,
      created_at: task.createdAt,
      project_id: task.projectId,
      subtasks: task.subtasks ?? [],
      description: task.description ?? null,
      due_date: task.dueDate ?? null,
      "order": task.order ?? null,
      archived_at: task.archivedAt ?? null,
      recurrence: task.recurrence ?? null,
    };
    
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
    
    const { error } = await this.supabase
      .from("project_collaborators")
      .delete()
      .eq("project_id", projectId)
      .eq("owner_id", ownerId)
      .eq("collaborator_id", userId);
      
    if (error) {
      console.error("[Foci] leaveProject error:", error);
      throw new Error(error.message);
    }
  }

  // ── Account-Level Sharing ─────────────────────────────────────

  async getAccountCollaborators(): Promise<AccountCollaboratorInfo[]> {
    const userId = await this.getUserId();
    
    const { data, error } = await this.supabase
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
      
    if (error) {
      console.error("[Foci] getAccountCollaborators error:", error);
      throw new Error(error.message);
    }
    
    if (!data) return [];
    
    return data.map((row) => {
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
  }

  async inviteAccountCollaborator(email: string, role: CollaboratorRole): Promise<void> {
    const userId = await this.getUserId();
    
    // Check if user exists
    const { data: existingUser } = await this.supabase
      .from("user_profiles")
      .select("user_id")
      .eq("email", email.toLowerCase())
      .single();
    
    // Check for existing collaboration
    if (existingUser) {
      const { data: existing } = await this.supabase
        .from("account_collaborators")
        .select("id")
        .eq("owner_id", userId)
        .eq("collaborator_id", existingUser.user_id)
        .single();
        
      if (existing) {
        throw new Error("This user already has access to your account");
      }
      
      // Directly add as collaborator
      const { error } = await this.supabase
        .from("account_collaborators")
        .insert({
          owner_id: userId,
          collaborator_id: existingUser.user_id,
          role,
        });
        
      if (error) {
        console.error("[Foci] inviteAccountCollaborator direct add error:", error);
        throw new Error(error.message);
      }
      return;
    }
    
    // Create invite for non-existing user
    const { error } = await this.supabase
      .from("account_invites")
      .insert({
        owner_id: userId,
        invitee_email: email.toLowerCase(),
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
      .single();
    
    return data.map((row) => ({
      id: row.id,
      ownerEmail: profile?.email ?? "",
      ownerName: profile?.display_name ?? undefined,
      ownerId: userId,
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
    
    const { data, error } = await this.supabase
      .from("account_invites")
      .select(`
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
      `)
      .or(`invitee_id.eq.${userId},invitee_email.ilike.${userEmail}`)
      .eq("status", "pending");
      
    if (error) {
      console.error("[Foci] getReceivedAccountInvites error:", error);
      throw new Error(error.message);
    }
    
    if (!data) return [];
    
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
    const userId = await this.getUserId();
    
    // Get invite details
    const { data: invite, error: fetchError } = await this.supabase
      .from("account_invites")
      .select("*")
      .eq("id", inviteId)
      .single();
      
    if (fetchError || !invite) {
      throw new Error("Invite not found");
    }
    
    if (invite.status !== "pending") {
      throw new Error("Invite is no longer pending");
    }
    
    if (new Date(invite.expires_at) < new Date()) {
      throw new Error("Invite has expired");
    }
    
    // Add as account collaborator
    const { error: insertError } = await this.supabase
      .from("account_collaborators")
      .insert({
        owner_id: invite.owner_id,
        collaborator_id: userId,
        role: invite.role,
      });
      
    if (insertError) {
      console.error("[Foci] acceptAccountInvite insert error:", insertError);
      throw new Error(insertError.message);
    }
    
    // Update invite status
    const { error: updateError } = await this.supabase
      .from("account_invites")
      .update({ 
        status: "accepted",
        accepted_at: new Date().toISOString(),
        invitee_id: userId,
      })
      .eq("id", inviteId);
      
    if (updateError) {
      console.error("[Foci] acceptAccountInvite update error:", updateError);
    }
  }

  async declineAccountInvite(inviteId: string): Promise<void> {
    const userId = await this.getUserId();
    
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
