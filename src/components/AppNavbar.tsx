"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/components/AuthProvider";
import CollaborationInvitesButton from "@/components/CollaborationInvitesButton";
import WhatsNewBanner from "@/components/WhatsNewBanner";
import WeatherTime from "@/components/WeatherTime";
import { FilantusCrossPromoBanner } from "@/components/FilantusCrossPromoBanner";
import { loadSettings, saveSettings as persistSettings } from "@/lib/storage";
import { DEFAULT_SETTINGS, type Settings } from "@/lib/types";
import type { ImportResult } from "@/components/TaskImportExport";

const SettingsPanel = dynamic(() => import("@/components/SettingsPanel"), { ssr: false });

interface AppNavbarProps {
  focusMode?: boolean;
  /** When set (e.g. on /app), sync settings with the live timer. */
  settings?: Settings;
  onSaveSettings?: (settings: Settings) => void;
  onTasksImported?: (result?: ImportResult) => void;
}

/** Site-wide navbar — logged-out visitors get a lean marketing chrome; signed-in users get weather, settings, and app toolbar. */
export default function AppNavbar({
  focusMode = false,
  settings: externalSettings,
  onSaveSettings,
  onTasksImported,
}: AppNavbarProps) {
  const { user } = useAuth();
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
    const open = (e: Event) => {
      const detail = (e as CustomEvent<{ tab?: string }>).detail;
      if (detail?.tab === "sharing" || detail?.tab === "timer" || detail?.tab === "experience" || detail?.tab === "data") {
        // SettingsPanel reads pending tab from sessionStorage on mount
        sessionStorage.setItem("foci-settings-tab", detail.tab);
      }
      setShowSettings(true);
    };
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
        onOpenSettings={user ? () => setShowSettings(true) : undefined}
        centerSlot={
          focusMode ? undefined : (
            <div
              className={
                user
                  ? "flex items-center justify-center gap-10 sm:gap-12 min-w-0 w-full max-w-3xl"
                  : "flex items-center justify-end min-w-0 w-full"
              }
            >
              {user ? (
                <div className="min-w-0 shrink">
                  <WeatherTime nav />
                </div>
              ) : null}
              <FilantusCrossPromoBanner />
            </div>
          )
        }
        toolbarSlot={
          user ? (
            <div className="flex items-center gap-0.5">
              <CollaborationInvitesButton />
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
