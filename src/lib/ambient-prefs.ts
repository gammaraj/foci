const MODE_KEY = "foci_ambient_mode";
const SOUND_KEY = "foci_ambient_sound";
const VOLUME_KEY = "foci_ambient_volume";

export type AmbientMode = "sounds" | "spotify" | "soundcloud";
export type AmbientSound = "rain" | "whitenoise" | "brownnoise" | "cafe" | "lofi";

const VALID_MODES: AmbientMode[] = ["sounds", "spotify", "soundcloud"];
const VALID_SOUNDS: AmbientSound[] = ["rain", "whitenoise", "brownnoise", "cafe", "lofi"];

export function getAmbientMode(): AmbientMode {
  if (typeof window === "undefined") return "sounds";
  const raw = localStorage.getItem(MODE_KEY);
  if (raw === "lofi") return "soundcloud";
  return VALID_MODES.includes(raw as AmbientMode) ? (raw as AmbientMode) : "sounds";
}

export function setAmbientMode(mode: AmbientMode): void {
  localStorage.setItem(MODE_KEY, mode);
}

export function getAmbientSound(): AmbientSound | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SOUND_KEY);
  return VALID_SOUNDS.includes(raw as AmbientSound) ? (raw as AmbientSound) : null;
}

export function setAmbientSound(sound: AmbientSound | null): void {
  if (sound) localStorage.setItem(SOUND_KEY, sound);
  else localStorage.removeItem(SOUND_KEY);
}

export function getAmbientVolume(): number {
  if (typeof window === "undefined") return 0.5;
  const raw = localStorage.getItem(VOLUME_KEY);
  const n = raw != null ? parseFloat(raw) : 0.5;
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0.5;
}

export function setAmbientVolume(volume: number): void {
  localStorage.setItem(VOLUME_KEY, String(volume));
}
