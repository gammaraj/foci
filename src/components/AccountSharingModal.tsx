"use client";

import { reportError } from "@/lib/report-error";
import React, { useState, useEffect, useRef } from "react";
import { getStorage } from "@/lib/storage";
import type { AccountCollaboratorInfo, AccountInvite, CollaboratorRole } from "@/lib/storage";
import { useToast } from "@/components/ToastProvider";
import {
  buildAccountInviteMessage,
  copyText,
} from "@/lib/collaboration-invite";
import { trackInviteSent, trackShareModalOpened } from "@/lib/analytics";

interface AccountSharingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AccountSharingModal({
  isOpen,
  onClose,
}: AccountSharingModalProps) {
  const { showToast } = useToast();
  const modalRef = useRef<HTMLDivElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) trackShareModalOpened("account");
  }, [isOpen]);

  const [collaborators, setCollaborators] = useState<AccountCollaboratorInfo[]>([]);
  const [pendingInvites, setPendingInvites] = useState<AccountInvite[]>([]);
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
        const storage = getStorage();
        const [collabsResult, invitesResult] = await Promise.allSettled([
          storage.getAccountCollaborators(),
          storage.getSentAccountInvites(),
        ]);

        if (collabsResult.status === "fulfilled") {
          setCollaborators(collabsResult.value);
        } else {
          reportError("Failed to load account collaborators", collabsResult.reason);
          setCollaborators([]);
        }

        if (invitesResult.status === "fulfilled") {
          setPendingInvites(invitesResult.value);
        } else {
          reportError("Failed to load account invites", invitesResult.reason);
          setPendingInvites([]);
        }

        if (collabsResult.status === "rejected" && invitesResult.status === "rejected") {
          const message =
            collabsResult.reason instanceof Error
              ? collabsResult.reason.message
              : "Unknown error";
          showToast(`Failed to load account sharing settings: ${message}`, "error");
        } else if (collabsResult.status === "rejected") {
          const message =
            collabsResult.reason instanceof Error
              ? collabsResult.reason.message
              : "Unknown error";
          showToast(`Failed to load collaborators: ${message}`, "error");
        } else if (invitesResult.status === "rejected") {
          const message =
            invitesResult.reason instanceof Error
              ? invitesResult.reason.message
              : "Unknown error";
          showToast(`Failed to load pending invites: ${message}`, "error");
        }
      } catch (err) {
        reportError("Failed to load account collaborators", err);
        const message = err instanceof Error ? err.message : "Unknown error";
        showToast(`Failed to load account sharing settings: ${message}`, "error");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isOpen, showToast]);

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
      showToast("Please enter a valid email address", "info");
      return;
    }

    // Check if already a collaborator
    if (collaborators.some((c) => c.email.toLowerCase() === email)) {
      showToast("This person already has access to your account", "info");
      return;
    }

    // Check if already invited
    if (pendingInvites.some((i) => (i.inviteeEmail ?? "").toLowerCase() === email)) {
      showToast("An invite is already pending for this email", "info");
      return;
    }

    setInviting(true);
    try {
      const storage = getStorage();
      await storage.inviteAccountCollaborator(email, inviteRole);
      trackInviteSent({ scope: "account", role: inviteRole });
      const message = buildAccountInviteMessage({
        inviteeEmail: email,
        role: inviteRole,
      });
      const copied = await copyText(message);
      showToast(
        copied
          ? `Invite saved for ${email}. Invite text copied — paste it in email or chat (Foci doesn’t send email yet).`
          : `Invite saved for ${email}. Copy the invite text from Pending and send it yourself — Foci doesn’t email invites yet.`,
        "success",
      );
      setInviteEmail("");
      
      // Refresh list
      const [collabsResult, invitesResult] = await Promise.allSettled([
        storage.getAccountCollaborators(),
        storage.getSentAccountInvites(),
      ]);
      if (collabsResult.status === "fulfilled") setCollaborators(collabsResult.value);
      if (invitesResult.status === "fulfilled") setPendingInvites(invitesResult.value);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save invite";
      showToast(message, "error");
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveCollaborator = async (collaboratorId: string, email: string) => {
    try {
      const storage = getStorage();
      await storage.removeAccountCollaborator(collaboratorId);
      setCollaborators((prev) => prev.filter((c) => c.userId !== collaboratorId));
      showToast(`Removed ${email}'s access`, "success");
    } catch (err) {
      showToast("Failed to remove access", "error");
    }
  };

  const handleUpdateRole = async (collaboratorId: string, newRole: CollaboratorRole) => {
    try {
      const storage = getStorage();
      await storage.updateAccountCollaboratorRole(collaboratorId, newRole);
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
      const storage = getStorage();
      await storage.cancelAccountInvite(inviteId);
      setPendingInvites((prev) => prev.filter((i) => i.id !== inviteId));
      showToast("Invite cancelled", "info");
    } catch (err) {
      showToast("Failed to cancel invite", "error");
    }
  };

  const handleCopyInvite = async (invite: AccountInvite) => {
    const email = invite.inviteeEmail;
    if (!email) {
      showToast("This invite has no email to copy", "info");
      return;
    }
    const message = buildAccountInviteMessage({
      inviteeEmail: email,
      role: invite.role,
    });
    const copied = await copyText(message);
    showToast(copied ? "Invite text copied" : "Could not copy — select and copy manually", copied ? "success" : "error");
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
        aria-labelledby="account-share-title"
        className="fixed left-4 right-4 bottom-4 safe-bottom z-[9991] max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto bg-white dark:bg-[#131d30] border border-slate-200 dark:border-[#243350] rounded-xl shadow-2xl p-5 sm:left-1/2 sm:right-auto sm:bottom-auto sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 id="account-share-title" className="text-lg font-semibold text-slate-900 dark:text-white">
              Share All Projects
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Give someone access to all current and future projects
            </p>
          </div>
          <button
            onClick={onClose}
            className="touch-target-sm p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1a2d4a]"
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
            Invite to full account access
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              ref={emailInputRef}
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@example.com"
              className="flex-1 px-3 py-2.5 text-sm border border-slate-200 dark:border-[#243350] rounded-lg bg-[var(--surface-elevated)] dark:bg-[#0f172a] text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
              disabled={inviting}
            />
            <div className="flex gap-2">
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as CollaboratorRole)}
              className="flex-1 sm:flex-none px-3 py-2.5 text-sm border border-slate-200 dark:border-[#243350] rounded-lg bg-[var(--surface-elevated)] dark:bg-[#0f172a] text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
              disabled={inviting}
            >
              <option value="editor">Can edit</option>
              <option value="viewer">Can view</option>
            </select>
            <button
              type="submit"
              disabled={inviting || !inviteEmail.trim()}
              className="btn-primary flex-1 sm:flex-none px-4 py-2.5 text-sm touch-target-sm"
            >
              {inviting ? "..." : "Invite"}
            </button>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Foci saves the invite in-app (no email is sent). We&apos;ll copy a short message you can paste to them.
            Once they accept, they&apos;ll see all your projects, including ones you create later. Editors can add,
            complete, and edit tasks; viewers can only view. Only you can delete.
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
                  People with full access ({collaborators.length})
                </h3>
                <ul className="space-y-2">
                  {collaborators.map((collab) => (
                    <li
                      key={collab.userId}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-[#243350] rounded-lg"
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
                              {(collab.displayName || collab.email || "?").charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {collab.displayName || collab.email || "Unknown user"}
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
                          onChange={(e) => handleUpdateRole(collab.userId, e.target.value as CollaboratorRole)}
                          className="text-xs px-2 py-1 border border-slate-200 dark:border-[#243350] rounded bg-white dark:bg-[#131d30] text-slate-700 dark:text-slate-200"
                        >
                          <option value="editor">Can edit</option>
                          <option value="viewer">Can view</option>
                        </select>
                        <button
                          onClick={() => handleRemoveCollaborator(collab.userId, collab.email)}
                          className="touch-target-sm p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400"
                          aria-label={`Remove ${collab.email}`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                No one has full account access yet.
              </p>
            )}
          </>
        )}

        <div className="mt-6 sm:hidden">
          <button
            type="button"
            onClick={onClose}
            className="btn-chip w-full py-2.5 text-sm touch-target-sm"
          >
            Done
          </button>
        </div>
      </div>
    </>
  );
}
