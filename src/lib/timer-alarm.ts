const ENABLED_KEY = "foci_timer_alarm_enabled";
const SOUND_KEY = "foci_timer_alarm_sound";

export const ALARM_SOUND_IDS = ["chime", "bell", "digital", "wood", "soft"] as const;
export type AlarmSoundId = (typeof ALARM_SOUND_IDS)[number];
export const DEFAULT_ALARM_SOUND: AlarmSoundId = "digital";

export const ALARM_SOUNDS: { id: AlarmSoundId; label: string }[] = [
  { id: "chime", label: "Chime" },
  { id: "bell", label: "Bell" },
  { id: "digital", label: "Digital" },
  { id: "wood", label: "Wood" },
  { id: "soft", label: "Soft" },
];

export function isAlarmSoundId(value: string | null | undefined): value is AlarmSoundId {
  return !!value && (ALARM_SOUND_IDS as readonly string[]).includes(value);
}

function sessionStore(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage;
  } catch {
    return null;
  }
}

/** Copy one-time localStorage alarm picks into this tab's session, then drop the old keys. */
export function migrateLegacyAlarmToSession(): void {
  const session = sessionStore();
  if (!session) return;
  try {
    if (session.getItem(SOUND_KEY) == null) {
      const legacySound = localStorage.getItem(SOUND_KEY);
      if (legacySound) session.setItem(SOUND_KEY, legacySound);
    }
    if (session.getItem(ENABLED_KEY) == null) {
      const legacyEnabled = localStorage.getItem(ENABLED_KEY);
      if (legacyEnabled != null) session.setItem(ENABLED_KEY, legacyEnabled);
    }
    localStorage.removeItem(SOUND_KEY);
    localStorage.removeItem(ENABLED_KEY);
  } catch {
    /* ignore quota / private-mode */
  }
}

export function getTimerAlarmEnabled(): boolean {
  migrateLegacyAlarmToSession();
  const session = sessionStore();
  if (!session) return true;
  return session.getItem(ENABLED_KEY) !== "false";
}

export function setTimerAlarmEnabled(enabled: boolean): void {
  const session = sessionStore();
  if (!session) return;
  session.setItem(ENABLED_KEY, enabled ? "true" : "false");
}

export function getTimerAlarmSound(): AlarmSoundId {
  migrateLegacyAlarmToSession();
  const session = sessionStore();
  if (!session) return DEFAULT_ALARM_SOUND;
  const raw = session.getItem(SOUND_KEY);
  return isAlarmSoundId(raw) ? raw : DEFAULT_ALARM_SOUND;
}

export function setTimerAlarmSound(sound: AlarmSoundId): void {
  const session = sessionStore();
  if (!session) return;
  session.setItem(SOUND_KEY, sound);
}

export function hasSessionAlarmOverride(): boolean {
  const session = sessionStore();
  if (!session) return false;
  return session.getItem(SOUND_KEY) != null || session.getItem(ENABLED_KEY) != null;
}

export function clearSessionAlarm(): void {
  const session = sessionStore();
  if (!session) return;
  session.removeItem(SOUND_KEY);
  session.removeItem(ENABLED_KEY);
}

type AudioContextCtor = typeof AudioContext;

let ctx: AudioContext | null = null;
let keepAliveOsc: OscillatorNode | null = null;
let activeNodes: AudioNode[] = [];
let pendingPlay: { preview: boolean; sound?: AlarmSoundId } | null = null;
let listenersInstalled = false;

function getAudioContextClass(): AudioContextCtor | null {
  if (typeof window === "undefined") return null;
  return window.AudioContext || (window as Window & { webkitAudioContext?: AudioContextCtor }).webkitAudioContext || null;
}

function ensureContext(): AudioContext | null {
  const Ctor = getAudioContextClass();
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  return ctx;
}

async function resumeContext(): Promise<AudioContext | null> {
  const audio = ensureContext();
  if (!audio) return null;
  if (audio.state === "suspended") {
    try {
      await audio.resume();
    } catch {
      return audio;
    }
  }
  return audio;
}

function ensureKeepAlive(audio: AudioContext) {
  if (keepAliveOsc) return;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.frequency.value = 20;
  gain.gain.value = 0.00001;
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start();
  keepAliveOsc = osc;
}

function stopActiveAlarm() {
  for (const node of activeNodes) {
    try {
      if (node instanceof OscillatorNode || node instanceof AudioBufferSourceNode) {
        node.stop();
      }
    } catch {
      /* already stopped */
    }
    try {
      node.disconnect();
    } catch {
      /* already disconnected */
    }
  }
  activeNodes = [];
}

function track(node: AudioNode) {
  activeNodes.push(node);
}

function scheduleTone(
  audio: AudioContext,
  dest: AudioNode,
  {
    type,
    frequency,
    start,
    duration,
    peak = 0.28,
    endFrequency,
  }: {
    type: OscillatorType;
    frequency: number;
    start: number;
    duration: number;
    peak?: number;
    endFrequency?: number;
  },
) {
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, start);
  if (endFrequency != null) {
    osc.frequency.linearRampToValueAtTime(endFrequency, start + duration);
  }
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(dest);
  osc.start(start);
  osc.stop(start + duration + 0.02);
  track(osc);
  track(gain);
}

function playNoiseBurst(
  audio: AudioContext,
  dest: AudioNode,
  start: number,
  duration: number,
  peak: number,
) {
  const length = Math.max(1, Math.floor(audio.sampleRate * duration));
  const buffer = audio.createBuffer(1, length, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  const source = audio.createBufferSource();
  source.buffer = buffer;
  const filter = audio.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 720;
  filter.Q.value = 1.8;
  const gain = audio.createGain();
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  source.start(start);
  source.stop(start + duration + 0.02);
  track(source);
  track(filter);
  track(gain);
}

function playSound(audio: AudioContext, sound: AlarmSoundId, preview: boolean) {
  stopActiveAlarm();
  const master = audio.createGain();
  master.gain.value = preview ? 0.55 : 0.85;
  master.connect(audio.destination);
  track(master);
  const t = audio.currentTime + 0.01;

  switch (sound) {
    case "chime":
      scheduleTone(audio, master, { type: "sine", frequency: 1047, start: t, duration: preview ? 0.35 : 0.55, peak: 0.32 });
      scheduleTone(audio, master, { type: "sine", frequency: 1319, start: t + (preview ? 0.18 : 0.28), duration: preview ? 0.45 : 0.8, peak: 0.28 });
      if (!preview) {
        scheduleTone(audio, master, { type: "sine", frequency: 1568, start: t + 0.7, duration: 0.9, peak: 0.22 });
      }
      break;
    case "bell":
      scheduleTone(audio, master, { type: "sine", frequency: 523, start: t, duration: preview ? 0.7 : 1.8, peak: 0.3 });
      scheduleTone(audio, master, { type: "sine", frequency: 1046, start: t, duration: preview ? 0.6 : 1.5, peak: 0.16 });
      scheduleTone(audio, master, { type: "triangle", frequency: 1568, start: t, duration: preview ? 0.45 : 1.1, peak: 0.08 });
      if (!preview) {
        scheduleTone(audio, master, { type: "sine", frequency: 659, start: t + 0.85, duration: 1.4, peak: 0.22 });
      }
      break;
    case "digital": {
      const beeps = preview ? 2 : 4;
      for (let i = 0; i < beeps; i++) {
        scheduleTone(audio, master, {
          type: "square",
          frequency: i % 2 === 0 ? 880 : 1175,
          start: t + i * 0.28,
          duration: 0.14,
          peak: 0.12,
        });
      }
      break;
    }
    case "wood":
      playNoiseBurst(audio, master, t, 0.07, 0.45);
      playNoiseBurst(audio, master, t + 0.16, 0.08, 0.38);
      if (!preview) playNoiseBurst(audio, master, t + 0.38, 0.1, 0.32);
      break;
    case "soft":
      scheduleTone(audio, master, {
        type: "sine",
        frequency: 392,
        endFrequency: 523,
        start: t,
        duration: preview ? 0.6 : 1.4,
        peak: 0.2,
      });
      if (!preview) {
        scheduleTone(audio, master, {
          type: "sine",
          frequency: 523,
          endFrequency: 659,
          start: t + 0.45,
          duration: 1.3,
          peak: 0.16,
        });
      }
      break;
  }
}

function vibrate(preview: boolean) {
  if (preview || typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  try {
    navigator.vibrate([180, 80, 180, 80, 320]);
  } catch {
    /* ignore */
  }
}

function installResumeListeners() {
  if (listenersInstalled || typeof window === "undefined") return;
  listenersInstalled = true;
  const flush = () => {
    if (!pendingPlay) return;
    const next = pendingPlay;
    pendingPlay = null;
    void playTimerAlarm(next);
  };
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") flush();
  });
  window.addEventListener("focus", flush);
  window.addEventListener("pointerdown", flush);
}

/** Resume/create the audio context during a user gesture so completion can beep later. */
export function unlockTimerAlarm(): void {
  installResumeListeners();
  void resumeContext().then((audio) => {
    if (audio) ensureKeepAlive(audio);
  });
}

/** Play the configured alarm, or a one-off preview of a specific sound. */
export async function playTimerAlarm(options?: {
  preview?: boolean;
  sound?: AlarmSoundId;
  enabled?: boolean;
}): Promise<void> {
  const preview = options?.preview === true;
  const enabled = options?.enabled ?? getTimerAlarmEnabled();
  if (!preview && !enabled) return;
  installResumeListeners();

  const sound = options?.sound ?? getTimerAlarmSound();
  const audio = await resumeContext();
  if (!audio || audio.state !== "running") {
    pendingPlay = { preview, sound: options?.sound };
    return;
  }

  try {
    playSound(audio, sound, preview);
    vibrate(preview);
  } catch {
    pendingPlay = { preview, sound: options?.sound };
  }
}
