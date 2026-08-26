"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/ToastProvider";
import {
  getReceivedInvites,
  acceptInvite,
  declineInvite,
  getReceivedAccountInvites,
  acceptAccountInvite,
  declineAccountInvite,
  getSharedProjects,
  CollaborationInvite,
  AccountInvite,
  SharedProject,
} from "@/lib/storage";
import { isExactTasksAppPath } from "@/lib/task-view-url";
import { trackCollaboratorAdded } from "@/lib/analytics";

const OPEN_SHARED_PROJECT_EVENT = "foci-open-shared-project";
const SHARED_UPDATED_EVENT = "foci-shared-updated";

export { OPEN_SHARED_PROJECT_EVENT, SHARED_UPDATED_EVENT };

export default function CollaborationInvitesButton() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const pathname = usePathname();
  const router = useRouter();
  const [projectInvites, setProjectInvites] = useState<CollaborationInvite[]>([]);
  const [accountInvites, setAccountInvites] = useState<AccountInvite[]>([]);
  const [sharedProjects, setSharedProjects] = useState<SharedProject[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const loadAll = useCallback(async () => {
    if (!user) {
      setProjectInvites([]);
      setAccountInvites([]);
      setSharedProjects([]);
      return;
    }

    setLoading(true);
    try {
      const [projectResult, accountResult, sharedResult] = await Promise.allSettled([
        getReceivedInvites(),
        getReceivedAccountInvites(),
        getSharedProjects(),
      ]);
      setProjectInvites(projectResult.status === "fulfilled" ? projectResult.value : []);
      setAccountInvites(accountResult.status === "fulfilled" ? accountResult.value : []);
      setSharedProjects(sharedResult.status === "fulfilled" ? sharedResult.value : []);
    } catch (err) {
      console.error("[Foci] Failed to load sharing hub:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 60000);
    return () => clearInterval(interval);
  }, [loadAll]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") loadAll();
    };
    const handleSharedUpdated = () => loadAll();
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener(SHARED_UPDATED_EVENT, handleSharedUpdated);
    window.addEventListener("tempo-tasks-updated", handleSharedUpdated);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener(SHARED_UPDATED_EVENT, handleSharedUpdated);
      window.removeEventListener("tempo-tasks-updated", handleSharedUpdated);
    };
  }, [loadAll]);

  useEffect(() => {
    if (!showPanel) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowPanel(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showPanel]);

  const refreshAfterAccept = () => {
    window.dispatchEvent(new Event("tempo-tasks-updated"));
    window.dispatchEvent(new Event(SHARED_UPDATED_EVENT));
    void loadAll();
  };

  const handleAccept = async (inviteId: string) => {
    setProcessingId(inviteId);
    try {
      await acceptInvite(inviteId);
      trackCollaboratorAdded({ scope: "project" });
      setProjectInvites((prev) => prev.filter((i) => i.id !== inviteId));
      showToast("Invite accepted — open it below under Shared with you", "success");
      refreshAfterAccept();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to accept invite";
      showToast(message, "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (inviteId: string) => {
    setProcessingId(inviteId);
    try {
      await declineInvite(inviteId);
      setProjectInvites((prev) => prev.filter((i) => i.id !== inviteId));
      showToast("Invite declined", "info");
    } catch {
      showToast("Failed to decline invite", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleAcceptAccountInvite = async (inviteId: string) => {
    setProcessingId(inviteId);
    try {
      await acceptAccountInvite(inviteId);
      trackCollaboratorAdded({ scope: "account" });
      setAccountInvites((prev) => prev.filter((i) => i.id !== inviteId));
      showToast("Access granted — their projects are listed below", "success");
      refreshAfterAccept();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to accept invite";
      showToast(message, "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeclineAccountInvite = async (inviteId: string) => {
    setProcessingId(inviteId);
    try {
      await declineAccountInvite(inviteId);
      setAccountInvites((prev) => prev.filter((i) => i.id !== inviteId));
      showToast("Invite declined", "info");
    } catch {
      showToast("Failed to decline invite", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const openSharedProject = (sp: SharedProject) => {
    setShowPanel(false);
    if (!isExactTasksAppPath(pathname)) {
      sessionStorage.setItem(
        "foci-pending-shared-project",
        JSON.stringify({ ownerId: sp._ownerId, projectId: sp.id }),
      );
      router.push("/app/cards");
      return;
    }
    window.dispatchEvent(
      new CustomEvent(OPEN_SHARED_PROJECT_EVENT, {
        detail: { ownerId: sp._ownerId, projectId: sp.id },
      }),
    );
  };

  const openShareSettings = () => {
    setShowPanel(false);
    window.dispatchEvent(
      new CustomEvent("foci-open-settings", { detail: { tab: "sharing" } }),
    );
  };

  if (!user) return null;

  const inviteCount = projectInvites.length + accountInvites.length;
  const sharedCount = sharedProjects.length;
  const badgeCount = inviteCount;

  // Group shared projects by owner for easier scanning
  const sharedByOwner = sharedProjects.reduce<
    { ownerKey: string; ownerLabel: string; projects: SharedProject[] }[]
  >((groups, sp) => {
    const existing = groups.find((g) => g.ownerKey === sp._ownerId);
    if (existing) {
      existing.projects.push(sp);
    } else {
      groups.push({
        ownerKey: sp._ownerId,
        ownerLabel: sp._ownerName || sp._ownerEmail.split("@")[0] || "Someone",
        projects: [sp],
      });
    }
    return groups;
  }, []);

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setShowPanel((prev) => !prev)}
        className={`relative nav-chrome-label-btn ${
          showPanel ? "bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white" : ""
        }`}
        aria-label={
          inviteCount > 0
            ? `Sharing: ${inviteCount} pending invite${inviteCount !== 1 ? "s" : ""}`
            : sharedCount > 0
              ? `Sharing: ${sharedCount} shared project${sharedCount !== 1 ? "s" : ""}`
              : "Sharing"
        }
        aria-expanded={showPanel}
        title={
          inviteCount > 0
            ? `${inviteCount} pending invite${inviteCount !== 1 ? "s" : ""}`
            : sharedCount > 0
              ? `${sharedCount} shared project${sharedCount !== 1 ? "s" : ""}`
              : "Invites and shared projects"
        }
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          className="w-4 h-4 opacity-80"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
        <span>Sharing</span>

        {badgeCount > 0 && (
          <span className="min-w-[18px] h-[18px] flex items-center justify-center text-xs app-badge text-white bg-blue-700 rounded-full px-1">
            {badgeCount > 9 ? "9+" : badgeCount}
          </span>
        )}
      </button>

      {showPanel && (
        <div className="fixed left-4 right-4 top-14 z-50 max-w-sm mx-auto sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:mx-0 sm:w-96 w-auto bg-white dark:bg-[#131d30] border border-slate-200 dark:border-[#243350] rounded-xl shadow-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-[#243350]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Sharing
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Invites and projects shared with you
                </p>
              </div>
              <button
                onClick={() => setShowPanel(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 -m-1"
                aria-label="Close"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="max-h-[min(28rem,70vh)] overflow-y-auto">
            {loading && inviteCount === 0 && sharedCount === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {/* Pending invites */}
                {inviteCount > 0 && (
                  <div className="border-b border-slate-200 dark:border-[#243350]">
                    <p className="px-4 pt-3 pb-1.5 app-section-label text-slate-500 dark:text-slate-400">
                      Pending invites
                    </p>
                    <ul className="divide-y divide-slate-100 dark:divide-[#243350]">
                      {accountInvites.map((invite) => (
                        <li key={`account-${invite.id}`} className="p-4">
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {invite.ownerName || invite.ownerEmail.split("@")[0]}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            All their projects · {invite.role === "editor" ? "Can edit" : "View only"}
                          </p>
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => handleAcceptAccountInvite(invite.id)}
                              disabled={processingId === invite.id}
                              className="btn-primary flex-1 px-3 py-1.5 text-sm"
                            >
                              {processingId === invite.id ? "..." : "Accept"}
                            </button>
                            <button
                              onClick={() => handleDeclineAccountInvite(invite.id)}
                              disabled={processingId === invite.id}
                              className="flex-1 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 rounded-lg"
                            >
                              Decline
                            </button>
                          </div>
                        </li>
                      ))}
                      {projectInvites.map((invite) => (
                        <li key={invite.id} className="p-4">
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {invite.ownerName || invite.ownerEmail.split("@")[0]}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            &quot;{invite.projectName}&quot; ·{" "}
                            {invite.role === "editor" ? "Can edit" : "View only"}
                          </p>
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => handleAccept(invite.id)}
                              disabled={processingId === invite.id}
                              className="btn-primary flex-1 px-3 py-1.5 text-sm"
                            >
                              {processingId === invite.id ? "..." : "Accept"}
                            </button>
                            <button
                              onClick={() => handleDecline(invite.id)}
                              disabled={processingId === invite.id}
                              className="flex-1 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 rounded-lg"
                            >
                              Decline
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Shared projects */}
                <div>
                  <p className="px-4 pt-3 pb-1.5 app-section-label text-slate-500 dark:text-slate-400">
                    Shared with you
                  </p>
                  {sharedCount === 0 ? (
                    <div className="px-4 pb-5 pt-2 text-center">
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {inviteCount > 0
                          ? "Accept an invite above to see projects here."
                          : "Nothing shared with you yet."}
                      </p>
                    </div>
                  ) : (
                    <ul className="pb-2">
                      {sharedByOwner.map((group) => (
                        <li key={group.ownerKey} className="px-2 pb-2">
                          <p className="px-2 py-1 text-xs text-slate-500 dark:text-slate-400">
                            From {group.ownerLabel}
                            {group.projects[0]?._shareSource === "account" ? " · full account" : ""}
                          </p>
                          {group.projects.map((sp) => (
                            <button
                              key={`${sp._ownerId}:${sp.id}`}
                              type="button"
                              onClick={() => openSharedProject(sp)}
                              className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-left hover:bg-slate-50 dark:hover:bg-[#152340] transition-colors"
                            >
                              {sp.color ? (
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: sp.color }}
                                />
                              ) : (
                                <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-slate-300 dark:bg-slate-600" />
                              )}
                              <span className="flex-1 min-w-0">
                                <span className="block text-sm font-medium text-slate-900 dark:text-white truncate">
                                  {sp.name}
                                </span>
                                <span className="block text-xs text-slate-500 dark:text-slate-400">
                                  {sp._myRole === "editor" ? "Can edit" : "View only"}
                                </span>
                              </span>
                              <span className="text-xs font-medium text-blue-600 dark:text-blue-400 shrink-0">
                                Open
                              </span>
                            </button>
                          ))}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="border-t border-slate-200 dark:border-[#243350] p-3">
            <button
              type="button"
              onClick={openShareSettings}
              className="btn-chip w-full px-3 py-2 text-sm"
            >
              Share your projects…
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
