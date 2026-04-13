import {
  Settings,
  DailyGoalData,
  StreakHistory,
  Task,
  Project,
} from "../types";

// ── Collaboration Types ─────────────────────────────────────

export type CollaboratorRole = "viewer" | "editor";

export interface CollaboratorInfo {
  userId: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  role: CollaboratorRole;
  addedAt: string;
}

export interface CollaborationInvite {
  id: string;
  projectId: string;
  projectName: string;
  ownerEmail: string;
  ownerName?: string;
  ownerId: string;
  role: CollaboratorRole;
  status: "pending" | "accepted" | "declined" | "expired";
  createdAt: string;
  expiresAt: string;
}

export interface SharedProject extends Project {
  _isShared: true;
  _ownerId: string;
  _ownerEmail: string;
  _ownerName?: string;
  _myRole: CollaboratorRole;
}

export type ProjectListItem = Project | SharedProject;

export function isSharedProject(p: ProjectListItem): p is SharedProject {
  return "_isShared" in p && p._isShared === true;
}

/**
 * StorageAdapter defines the contract for all persistence operations.
 * Implement this interface to swap the storage backend
 * (e.g. localStorage → PostgreSQL, Supabase, etc.).
 *
 * All methods are async to support remote databases out of the box.
 */
export interface StorageAdapter {
  // ── Settings ──────────────────────────────────────────
  loadSettings(): Promise<Settings>;
  saveSettings(settings: Settings): Promise<void>;

  // ── Daily Goal ────────────────────────────────────────
  loadDailyGoalData(dailyGoal: number): Promise<DailyGoalData>;
  saveDailyGoalData(data: DailyGoalData): Promise<void>;

  // ── Streak History ────────────────────────────────────
  loadStreakHistory(): Promise<StreakHistory>;
  saveStreakHistory(history: StreakHistory): Promise<void>;
  recordDayCompletion(
    date: Date,
    sessionCount: number,
    goalMet: boolean,
  ): Promise<void>;

  // ── Tasks ─────────────────────────────────────────────
  loadTasks(): Promise<Task[]>;
  saveTasks(tasks: Task[]): Promise<void>;
  saveTask(task: Task): Promise<void>;
  deleteTask(id: string): Promise<void>;
  deleteTasks(ids: string[]): Promise<void>;

  // ── Projects ──────────────────────────────────────────
  loadProjects(): Promise<Project[]>;
  saveProjects(projects: Project[]): Promise<void>;
  deleteProject(id: string): Promise<void>;
  loadSelectedProjectId(): Promise<string>;
  saveSelectedProjectId(id: string): Promise<void>;

  // ── Collaboration ─────────────────────────────────────
  // Get collaborators for a project (owner only)
  getProjectCollaborators(projectId: string): Promise<CollaboratorInfo[]>;
  
  // Invite a collaborator by email
  inviteCollaborator(projectId: string, email: string, role: CollaboratorRole): Promise<void>;
  
  // Remove a collaborator
  removeCollaborator(projectId: string, collaboratorId: string): Promise<void>;
  
  // Update collaborator role
  updateCollaboratorRole(projectId: string, collaboratorId: string, role: CollaboratorRole): Promise<void>;
  
  // Get pending invites I've sent (owner)
  getSentInvites(projectId: string): Promise<CollaborationInvite[]>;
  
  // Cancel a pending invite
  cancelInvite(inviteId: string): Promise<void>;
  
  // Get invites I've received
  getReceivedInvites(): Promise<CollaborationInvite[]>;
  
  // Accept an invite
  acceptInvite(inviteId: string): Promise<void>;
  
  // Decline an invite
  declineInvite(inviteId: string): Promise<void>;
  
  // Get shared projects (projects I collaborate on but don't own)
  getSharedProjects(): Promise<SharedProject[]>;
  
  // Load tasks for a shared project
  loadSharedProjectTasks(projectId: string, ownerId: string): Promise<Task[]>;
  
  // Update a task in a shared project (editors only)
  updateSharedTask(task: Task, ownerId: string): Promise<void>;
  
  // Leave a shared project
  leaveProject(projectId: string, ownerId: string): Promise<void>;
}
