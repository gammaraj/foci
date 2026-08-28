import type { CollaboratorRole, SharedProject } from "./types";

export type SharedProjectRow = {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  due_date?: string | null;
  archived?: boolean | null;
  sort_order?: number | null;
  created_at: number;
};

export type AccountShareRow = {
  owner_id: string;
  role: CollaboratorRole;
  ownerEmail: string;
  ownerName?: string;
};

/** Merge account-level owner projects into shared results (batched, no N+1). */
export function appendAccountSharedProjects(
  result: SharedProject[],
  accountShares: AccountShareRow[],
  ownerProjects: SharedProjectRow[],
): SharedProject[] {
  const byOwner = new Map<string, SharedProjectRow[]>();
  for (const project of ownerProjects) {
    const list = byOwner.get(project.user_id);
    if (list) list.push(project);
    else byOwner.set(project.user_id, [project]);
  }

  const existing = new Set(result.map((p) => `${p._ownerId}:${p.id}`));

  for (const share of accountShares) {
    const projects = byOwner.get(share.owner_id) ?? [];
    for (const project of projects) {
      const key = `${project.user_id}:${project.id}`;
      if (existing.has(key)) continue;
      existing.add(key);
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
        _ownerEmail: share.ownerEmail,
        _ownerName: share.ownerName,
        _myRole: share.role,
        _shareSource: "account",
      });
    }
  }

  return result;
}
