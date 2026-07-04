"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import TaskPanelQuote from "@/components/TaskPanelQuote";
import { useAuth } from "@/components/AuthProvider";
import CollaborationInvitesButton from "@/components/CollaborationInvitesButton";
import NotificationBell from "@/components/NotificationBell";
import WhatsNewBanner from "@/components/WhatsNewBanner";
import { loadSettings, saveSettings as persistSettings } from "@/lib/storage";
import { DEFAULT_SETTINGS, type Settings } from "@/lib/types";

const SettingsPanel = dynamic(() => import("@/components/SettingsPanel"), { ssr: false });

interface AppNavbarProps {
  focusMode?: boolean;
  /** When set (e.g. on /app), sync settings with the live timer. */
  settings?: Settings;
  onSaveSettings?: (settings: Settings) => void;
  onTasksImported?: () => void;
}

/** Site-wide navbar — same links, toolbar, and settings on every page. */
export default function AppNavbar({
  focusMode = false,
  settings: externalSettings,
  onSaveSettings,
  onTasksImported,
}: AppNavbarProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [showSettings, setShowSettings] = useState(false);
  const [internalSettings, setInternalSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    if (externalSettings) return;
    let cancelled = false;
    loadSettings()
      .then((loaded) => {
        if (!cancelled) {
          setInternalSettings(loaded);
          setSettingsLoaded(true);
        }
      })
      .catch((err) => {
        console.error("[Foci] Failed to load settings for navbar:", err);
        if (!cancelled) setSettingsLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [externalSettings, user?.id]);

  const settings = externalSettings ?? internalSettings;
  const settingsReady = externalSettings != null || settingsLoaded;

  const handleSaveSettings = useCallback(
    (next: Settings) => {
      if (onSaveSettings) {
        onSaveSettings(next);
      } else {
        setInternalSettings(next);
        persistSettings(next).catch((err) => {
          console.error("[Foci] Failed to save settings:", err);
        });
      }
    },
    [onSaveSettings]
  );

  useEffect(() => {
    const open = () => setShowSettings(true);
    const close = () => setShowSettings(false);
    window.addEventListener("foci-open-settings", open);
    window.addEventListener("foci-close-settings", close);
    return () => {
      window.removeEventListener("foci-open-settings", open);
      window.removeEventListener("foci-close-settings", close);
    };
  }, []);

  return (
    <>
      {/* HeadlessWhatsNewBanner listens for WHATS_NEW_SHOW_EVENT dispatched from UserMenu */}
      <WhatsNewBanner focusMode={focusMode} headless />
      <Navbar
        onOpenSettings={() => setShowSettings(true)}
        centerSlot={pathname === "/app" ? <TaskPanelQuote variant="navbar" /> : undefined}
        toolbarSlot={
          user ? (
            <div className="flex items-center gap-0.5">
              <CollaborationInvitesButton />
              <NotificationBell />
            </div>
          ) : undefined
        }
      />
      {showSettings && settingsReady && (
        <SettingsPanel
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
          onTasksImported={onTasksImported}
        />
      )}
    </>
  );
}
