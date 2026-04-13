"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/ToastProvider";
import {
  getReceivedInvites,
  acceptInvite,
  declineInvite,
  getReceivedAccountInvites,
  acceptAccountInvite,
  declineAccountInvite,
  CollaborationInvite,
  AccountInvite,
} from "@/lib/storage";

export default function CollaborationInvitesButton() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [projectInvites, setProjectInvites] = useState<CollaborationInvite[]>([]);
  const [accountInvites, setAccountInvites] = useState<AccountInvite[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Load invites when user is logged in
  const loadInvites = useCallback(async () => {
    if (!user) {
      setProjectInvites([]);
      setAccountInvites([]);
      return;
    }

    setLoading(true);
    try {
      const [projectReceived, accountReceived] = await Promise.all([
        getReceivedInvites(),
        getReceivedAccountInvites(),
      ]);
      setProjectInvites(projectReceived);
      setAccountInvites(accountReceived);
    } catch (err) {
      console.error("[Foci] Failed to load invites:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadInvites();
    
    // Refresh invites periodically (every 60 seconds)
    const interval = setInterval(loadInvites, 60000);
    return () => clearInterval(interval);
  }, [loadInvites]);

  // Also refresh when the window becomes visible again
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        loadInvites();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [loadInvites]);

  // Close panel on outside click
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

  const handleAccept = async (inviteId: string) => {
    setProcessingId(inviteId);
    try {
      await acceptInvite(inviteId);
      setProjectInvites((prev) => prev.filter((i) => i.id !== inviteId));
      showToast("Invite accepted! Project added to your sidebar.", "success");
      // Dispatch event to refresh projects in TaskList
      window.dispatchEvent(new Event("tempo-tasks-updated"));
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
      showToast("Invite declined", "success");
    } catch (err) {
      showToast("Failed to decline invite", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleAcceptAccountInvite = async (inviteId: string) => {
    setProcessingId(inviteId);
    try {
      await acceptAccountInvite(inviteId);
      setAccountInvites((prev) => prev.filter((i) => i.id !== inviteId));
      showToast("You now have access to all their projects!", "success");
      // Dispatch event to refresh projects in TaskList
      window.dispatchEvent(new Event("tempo-tasks-updated"));
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
      showToast("Invite declined", "success");
    } catch (err) {
      showToast("Failed to decline invite", "error");
    } finally {
      setProcessingId(null);
    }
  };

  // Don't render if no user
  if (!user) return null;

  const inviteCount = projectInvites.length + accountInvites.length;

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setShowPanel((prev) => !prev)}
        className="relative text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10"
        aria-label={`${inviteCount} collaboration invite${inviteCount !== 1 ? "s" : ""}`}
        title={`${inviteCount} pending invite${inviteCount !== 1 ? "s" : ""}`}
      >
        {/* Users icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>

        {/* Badge for pending invites */}
        {inviteCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white bg-blue-500 rounded-full px-1">
            {inviteCount > 9 ? "9+" : inviteCount}
          </span>
        )}
      </button>

      {/* Invites panel dropdown */}
      {showPanel && (
        <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-sm bg-white dark:bg-[#1a2540] border border-slate-200 dark:border-[#2a3a5c] rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-[#2a3a5c]">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Collaboration Invites
              </h3>
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

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : inviteCount === 0 ? (
              <div className="py-8 text-center text-slate-500 dark:text-slate-400">
                <svg className="w-10 h-10 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-sm">No pending invites</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-200 dark:divide-[#2a3a5c]">
                {/* Account-level invites */}
                {accountInvites.map((invite) => (
                  <li key={`account-${invite.id}`} className="p-4 bg-purple-50/50 dark:bg-purple-900/10">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {invite.ownerName || invite.ownerEmail.split("@")[0]}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          invited you to access <span className="font-medium text-purple-600 dark:text-purple-400">all their projects</span>
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                          as {invite.role === "editor" ? "Editor" : "Viewer"} • Expires{" "}
                          {new Date(invite.expiresAt).toLocaleDateString()}
                        </p>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleAcceptAccountInvite(invite.id)}
                            disabled={processingId === invite.id}
                            className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg transition-colors"
                          >
                            {processingId === invite.id ? "..." : "Accept"}
                          </button>
                          <button
                            onClick={() => handleDeclineAccountInvite(invite.id)}
                            disabled={processingId === invite.id}
                            className="flex-1 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 rounded-lg transition-colors"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
                {/* Project-level invites */}
                {projectInvites.map((invite) => (
                  <li key={invite.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          {(invite.ownerName || invite.ownerEmail)[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {invite.ownerName || invite.ownerEmail.split("@")[0]}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          invited you to collaborate on
                        </p>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-1">
                          &quot;{invite.projectName}&quot;
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                          as {invite.role === "editor" ? "Editor" : "Viewer"} • Expires{" "}
                          {new Date(invite.expiresAt).toLocaleDateString()}
                        </p>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleAccept(invite.id)}
                            disabled={processingId === invite.id}
                            className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
                          >
                            {processingId === invite.id ? "..." : "Accept"}
                          </button>
                          <button
                            onClick={() => handleDecline(invite.id)}
                            disabled={processingId === invite.id}
                            className="flex-1 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 rounded-lg transition-colors"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
