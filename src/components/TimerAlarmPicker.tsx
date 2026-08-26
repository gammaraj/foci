"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useFocusSessionOptional } from "@/components/FocusSessionProvider";
import {
  ALARM_SOUNDS,
  getTimerAlarmEnabled,
  getTimerAlarmSound,
  playTimerAlarm,
  setTimerAlarmEnabled,
  setTimerAlarmSound,
  type AlarmSoundId,
} from "@/lib/timer-alarm";

interface TimerAlarmPickerProps {
  compact?: boolean;
  /** Shown in the session-complete toast so people can pick a sound after it rings. */
  afterFinish?: boolean;
  onPersist?: (alarmEnabled: boolean, alarmSound: AlarmSoundId) => void;
}

export default function TimerAlarmPicker({ compact = false, afterFinish = false, onPersist }: TimerAlarmPickerProps) {
  const { user } = useAuth();
  const focus = useFocusSessionOptional();
  const settings = focus?.timer.settings;
  const [enabled, setEnabled] = useState(true);
  const [sound, setSound] = useState<AlarmSoundId>("digital");

  useEffect(() => {
    if (settings) {
      setEnabled(settings.alarmEnabled);
      setSound(settings.alarmSound);
      return;
    }
    setEnabled(getTimerAlarmEnabled());
    setSound(getTimerAlarmSound());
  }, [settings?.alarmEnabled, settings?.alarmSound]);

  const persist = (alarmEnabled: boolean, alarmSound: AlarmSoundId) => {
    setEnabled(alarmEnabled);
    setSound(alarmSound);
    if (onPersist) {
      onPersist(alarmEnabled, alarmSound);
      return;
    }
    if (focus) {
      focus.timer.saveSettings({ ...focus.timer.settings, alarmEnabled, alarmSound });
      return;
    }
    setTimerAlarmEnabled(alarmEnabled);
    setTimerAlarmSound(alarmSound);
  };

  const pickSound = (id: AlarmSoundId) => {
    persist(true, id);
    void playTimerAlarm({ preview: true, sound: id });
  };

  const turnOff = () => {
    persist(false, sound);
  };

  const chip = (active: boolean) =>
    `px-2 py-1 rounded-md text-xs font-medium border transition-colors ${
      active
        ? "bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-200"
        : "border-slate-200 dark:border-[#243350] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1a2d4a]"
    }`;

  return (
    <div className={compact ? "space-y-1.5" : "space-y-2"}>
      {!compact && (
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            {afterFinish ? "Alarm sound" : "Session alarm"}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {afterFinish
              ? user
                ? "Saved to your Foci account for the next session."
                : "Saved for this browser session. Sign in to keep it across devices."
              : user
                ? "Plays when a work or break session ends. Saved to your account."
                : "Plays when a work or break session ends. Saved for this browser session until you sign in."}
          </p>
        </div>
      )}
      {compact && (
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {afterFinish ? "Change alarm sound" : "Alarm"}
        </p>
      )}
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Timer alarm sound">
        <button type="button" className={chip(!enabled)} onClick={turnOff} aria-pressed={!enabled}>
          Off
        </button>
        {ALARM_SOUNDS.map((option) => (
          <button
            key={option.id}
            type="button"
            className={chip(enabled && sound === option.id)}
            onClick={() => pickSound(option.id)}
            aria-pressed={enabled && sound === option.id}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
