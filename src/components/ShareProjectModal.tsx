"use client";

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
  const modalRef = useRef<HTMLDivElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  const [collaborators, setCollaborators] = useState<CollaboratorInfo[]>([]);
  const [pendingInvites, setPendingInvites] = useState<CollaborationInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<CollaboratorRole>("editor");
  const [inviting, setInviting] = useState(false);

  // Load collaborators and pending invites
  useEffect(() => {
    if (!isOpen) return;

    const load = async () => {
      setLoading(true);
      try {
        const [collabs, invites] = await Promise.all([
          getProjectCollaborators(project.id),
          getSentInvites(project.id),
        ]);
        setCollaborators(collabs);
        setPendingInvites(invites);
      } catch (err) {
        console.error("[Foci] Failed to load collaborators:", err);
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

  // Focus trap + ESC to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab" && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast("Please enter a valid email address", "error");
      return;
    }

    // Check if already a collaborator
    if (collaborators.some((c) => c.email.toLowerCase() === email)) {
      showToast("This person is already a collaborator", "error");
      return;
    }

    // Check if already invited
    if (pendingInvites.some((i) => i.ownerEmail.toLowerCase() === email)) {
      showToast("An invite has already been sent to this email", "error");
      return;
    }

    setInviting(true);
    try {
      await inviteCollaborator(project.id, email, inviteRole);
      showToast(`Invite sent to ${email}`, "success");
      setInviteEmail("");
      
      // Refresh pending invites
      const invites = await getSentInvites(project.id);
      setPendingInvites(invites);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send invite";
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
      showToast("Invite cancelled", "success");
    } catch (err) {
      showToast("Failed to cancel invite", "error");
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-[9990]" onClick={onClose} />
      
      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-title"
        className="fixed left-1/2 bottom-4 -translate-x-1/2 z-[9991] w-[calc(100vw-2rem)] max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto bg-white dark:bg-[#131d30] border border-slate-200 dark:border-[#243350] rounded-xl shadow-2xl p-5 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 id="share-title" className="text-lg font-bold text-slate-900 dark:text-white">
            Share "{project.name}"
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Invite form */}
        <form onSubmit={handleInvite} className="mb-6">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Invite collaborator
          </label>
          <div className="flex gap-2">
            <input
              ref={emailInputRef}
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@example.com"
              className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-[#243350] rounded-lg bg-white dark:bg-[#0a1628] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={inviting}
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as CollaboratorRole)}
              className="px-3 py-2 text-sm border border-slate-200 dark:border-[#243350] rounded-lg bg-white dark:bg-[#0a1628] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={inviting}
            >
              <option value="editor">Can edit</option>
              <option value="viewer">Can view</option>
            </select>
            <button
              type="submit"
              disabled={inviting || !inviteEmail.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {inviting ? "..." : "Invite"}
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Editors can complete and edit tasks. Viewers can only view.
          </p>
        </form>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
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
                            {invite.ownerEmail}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {invite.role === "editor" ? "Can edit" : "Can view"} • Expires {new Date(invite.expiresAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCancelInvite(invite.id)}
                        className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200"
                      >
                        Cancel
                      </button>
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
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-[#0a1628] border border-slate-200 dark:border-[#243350] rounded-lg"
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
                          className="text-xs px-2 py-1 border border-slate-200 dark:border-[#243350] rounded bg-white dark:bg-[#131d30] text-slate-700 dark:text-slate-300"
                        >
                          <option value="editor">Can edit</option>
                          <option value="viewer">Can view</option>
                        </select>
                        <button
                          onClick={() => handleRemoveCollaborator(collab.userId, collab.email)}
                          className="p-1 text-slate-400 hover:text-red-500 dark:hover:text-red-400"
                          aria-label={`Remove ${collab.email}`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : pendingInvites.length === 0 ? (
              <div className="text-center py-6 text-slate-500 dark:text-slate-400">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-sm">No collaborators yet</p>
                <p className="text-xs mt-1">Invite someone to collaborate on this project</p>
              </div>
            ) : null}
          </>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-[#243350]">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </>
  );
}
