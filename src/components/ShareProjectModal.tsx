"use client";

import { reportError } from "@/lib/report-error";
import React, { useState, useEffect, useRef } from "react";
import { Project } from "@/lib/types";
import {
  getProjectCollaborators,
  inviteCollaborator,
  removeCollaborator,
  updateCollaboratorRole,
  getSentInvites,
  cancelInvite,
  CollaboratorInfo,
  CollaborationInvite,
  CollaboratorRole,
} from "@/lib/storage";
import { useToast } from "@/components/ToastProvider";
import {
  buildProjectInviteMessage,
  copyText,
} from "@/lib/collaboration-invite";
import { trackInviteSent, trackShareModalOpened } from "@/lib/analytics";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { CloseIcon } from "@/components/ui/icons";
import { TextField } from "@/components/ui/TextField";
import { Select } from "@/components/ui/Select";

interface ShareProjectModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareProjectModal({
  project,
  isOpen,
  onClose,
}: ShareProjectModalProps) {
  const { showToast } = useToast();
  const emailInputRef = useRef<HTMLInputElement>(null);

  const [collaborators, setCollaborators] = useState<CollaboratorInfo[]>([]);
  const [pendingInvites, setPendingInvites] = useState<CollaborationInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<CollaboratorRole>("editor");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (isOpen) trackShareModalOpened("project");
  }, [isOpen, project.id]);

  // Load collaborators and pending invites
  useEffect(() => {
    if (!isOpen) return;

    const load = async () => {
      setLoading(true);
      try {
        const [collabsResult, invitesResult] = await Promise.allSettled([
          getProjectCollaborators(project.id),
          getSentInvites(project.id),
        ]);

        if (collabsResult.status === "fulfilled") {
          setCollaborators(collabsResult.value);
        } else {
          reportError("Failed to load collaborators", collabsResult.reason);
          setCollaborators([]);
        }

        if (invitesResult.status === "fulfilled") {
          setPendingInvites(invitesResult.value);
        } else {
          reportError("Failed to load invites", invitesResult.reason);
          setPendingInvites([]);
        }

        if (collabsResult.status === "rejected" && invitesResult.status === "rejected") {
          showToast("Failed to load collaborators", "error");
        } else if (collabsResult.status === "rejected" || invitesResult.status === "rejected") {
          showToast("Some sharing settings could not be loaded", "error");
        }
      } catch (err) {
        reportError("Failed to load collaborators", err);
        showToast("Failed to load collaborators", "error");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isOpen, project.id, showToast]);

  // Focus email input when modal opens
  useEffect(() => {
    if (isOpen && !loading) {
      setTimeout(() => emailInputRef.current?.focus(), 100);
    }
  }, [isOpen, loading]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast("Please enter a valid email address", "info");
      return;
    }

    // Check if already a collaborator
    if (collaborators.some((c) => c.email.toLowerCase() === email)) {
      showToast("This person is already a collaborator", "info");
      return;
    }

    // Check if already invited
    if (pendingInvites.some((i) => (i.inviteeEmail ?? "").toLowerCase() === email)) {
      showToast("An invite is already pending for this email", "info");
      return;
    }

    setInviting(true);
    try {
      await inviteCollaborator(project.id, email, inviteRole);
      trackInviteSent({ scope: "project", role: inviteRole });
      const message = buildProjectInviteMessage({
        projectName: project.name,
        inviteeEmail: email,
        role: inviteRole,
      });
      const copied = await copyText(message);
      showToast(
        copied
          ? `Invite saved for ${email}. Invite text copied — paste it in email or chat (Foci doesn’t send email yet).`
          : `Invite saved for ${email}. Copy the invite text below and send it yourself — Foci doesn’t email invites yet.`,
        "success",
      );
      setInviteEmail("");
      
      // Refresh pending invites
      const invites = await getSentInvites(project.id);
      setPendingInvites(invites);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save invite";
      showToast(message, "error");
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveCollaborator = async (collaboratorId: string, email: string) => {
    try {
      await removeCollaborator(project.id, collaboratorId);
      setCollaborators((prev) => prev.filter((c) => c.userId !== collaboratorId));
      showToast(`Removed ${email}`, "success");
    } catch (err) {
      showToast("Failed to remove collaborator", "error");
    }
  };

  const handleUpdateRole = async (collaboratorId: string, newRole: CollaboratorRole) => {
    try {
      await updateCollaboratorRole(project.id, collaboratorId, newRole);
      setCollaborators((prev) =>
        prev.map((c) =>
          c.userId === collaboratorId ? { ...c, role: newRole } : c
        )
      );
      showToast("Role updated", "success");
    } catch (err) {
      showToast("Failed to update role", "error");
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    try {
      await cancelInvite(inviteId);
      setPendingInvites((prev) => prev.filter((i) => i.id !== inviteId));
      showToast("Invite cancelled", "info");
    } catch (err) {
      showToast("Failed to cancel invite", "error");
    }
  };

  const handleCopyInvite = async (invite: CollaborationInvite) => {
    const email = invite.inviteeEmail;
    if (!email) {
      showToast("This invite has no email to copy", "info");
      return;
    }
    const message = buildProjectInviteMessage({
      projectName: project.name,
      inviteeEmail: email,
      role: invite.role,
    });
    const copied = await copyText(message);
    showToast(copied ? "Invite text copied" : "Could not copy — select and copy manually", copied ? "success" : "error");
  };

  if (!isOpen) return null;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      labelledBy="share-title"
      sizeClassName="max-w-md"
      initialFocusRef={emailInputRef}
    >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 id="share-title" className="text-lg font-semibold text-slate-900 dark:text-white">
            Share &ldquo;{project.name}&rdquo;
          </h2>
          <button
            onClick={onClose}
            className="touch-target-sm p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-surface-hover"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Invite form */}
        <form onSubmit={handleInvite} className="mb-6">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Invite collaborator
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <TextField
              ref={emailInputRef}
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@example.com"
              className="flex-1 dark:bg-surface-recessed"
              disabled={inviting}
            />
            <div className="flex gap-2">
            <Select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as CollaboratorRole)}
              className="flex-1 sm:flex-none dark:bg-surface-recessed"
              disabled={inviting}
            >
              <option value="editor">Can edit</option>
              <option value="viewer">Can view</option>
            </Select>
            <Button
              type="submit"
              disabled={inviting || !inviteEmail.trim()}
              loading={inviting}
              size="md"
              className="flex-1 sm:flex-none touch-target-sm"
            >
              Invite
            </Button>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Foci saves the invite in-app (no email is sent). We&apos;ll copy a short message you can paste to them.
            They sign in at usefoci.com/app and accept under the people icon. Editors can add, complete, and edit tasks;
            viewers can only view. Only the owner can delete.
          </p>
        </form>

        {loading ? (
          <div className="flex items-center justify-center py-8 text-blue-500">
            <Spinner size="md" />
          </div>
        ) : (
          <>
            {/* Pending invites */}
            {pendingInvites.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Pending invites
                </h3>
                <ul className="space-y-2">
                  {pendingInvites.map((invite) => (
                    <li
                      key={invite.id}
                      className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-200 dark:bg-amber-800 flex items-center justify-center">
                          <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {invite.inviteeEmail || "Invite pending"}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {invite.role === "editor" ? "Can edit" : "Can view"} • Expires {new Date(invite.expiresAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopyInvite(invite)}
                          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Copy text
                        </button>
                        <button
                          onClick={() => handleCancelInvite(invite.id)}
                          className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Current collaborators */}
            {collaborators.length > 0 ? (
              <div>
                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Collaborators ({collaborators.length})
                </h3>
                <ul className="space-y-2">
                  {collaborators.map((collab) => (
                    <li
                      key={collab.userId}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-surface-recessed border border-surface-border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {collab.avatarUrl ? (
                          <img
                            src={collab.avatarUrl}
                            alt=""
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                              {(collab.displayName || collab.email)[0].toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {collab.displayName || collab.email}
                          </p>
                          {collab.displayName && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {collab.email}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={collab.role}
                          onChange={(e) =>
                            handleUpdateRole(collab.userId, e.target.value as CollaboratorRole)
                          }
                          className="text-xs px-2 py-1 border border-surface-border rounded bg-surface-elevated text-slate-700 dark:text-slate-300"
                        >
                          <option value="editor">Can edit</option>
                          <option value="viewer">Can view</option>
                        </select>
                        <button
                          onClick={() => handleRemoveCollaborator(collab.userId, collab.email)}
                          className="touch-target-sm p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400"
                          aria-label={`Remove ${collab.email}`}
                        >
                          <CloseIcon size="sm" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : pendingInvites.length === 0 ? (
              <EmptyState
                className="py-4 gap-2 text-slate-500 dark:text-slate-400"
                title="No collaborators yet"
                body="Invite someone to collaborate on this project"
                titleClassName="text-sm font-normal text-slate-500 dark:text-slate-400"
                bodyClassName="text-xs mt-0"
                illustration={
                  <svg className="w-12 h-12 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                }
              />
            ) : null}
          </>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-surface-border">
          <Button type="button" variant="chip" size="md" className="w-full" onClick={onClose}>
            Done
          </Button>
        </div>
    </Modal>
  );
}
