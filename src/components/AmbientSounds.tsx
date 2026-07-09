"use client";

import { useState, useRef, useCallback, useEffect, type MouseEvent } from "react";
import { MiniPlayPauseIcon, miniPlayButtonClass } from "@/components/FocusStripControls";
import {
  getAmbientMode,
  getAmbientSound,
  getAmbientVolume,
  setAmbientMode,
  setAmbientSound,
  setAmbientVolume,
  type AmbientMode,
} from "@/lib/ambient-prefs";
import { trackSoundPlayed, trackSoundStopped } from "@/lib/analytics";

// ── Procedural ambient sound generators using Web Audio API ──
// No external files or streams needed — fully offline-capable.

type SoundType = "rain" | "whitenoise" | "brownnoise" | "cafe" | "lofi";

interface SoundOption {
  id: SoundType;
  label: string;
  emoji: string;
}

const SOUNDS: SoundOption[] = [
  { id: "rain", label: "Rain", emoji: "🌧️" },
  { id: "cafe", label: "Café", emoji: "☕" },
  { id: "whitenoise", label: "White Noise", emoji: "📻" },
  { id: "brownnoise", label: "Brown Noise", emoji: "🟤" },
];

// Lofi Girl rotates live broadcasts (new video IDs each season). Channel embeds
// always resolve to the current live stream — static IDs like jfKfPfyJRdk break.
const LOFI_GIRL_CHANNEL_ID = "UCSJ4gkVC6NrvII8umztf0Ow";
const LOFI_SYNTHWAVE_CHANNEL_ID = "UCc5afI6TobiZjRke2sYBDPA";

const YOUTUBE_STREAMS = [
  {
    channelId: LOFI_GIRL_CHANNEL_ID,
    label: "Lofi Girl live",
    channel: "Lofi Girl",
    watchUrl: "https://www.youtube.com/@LofiGirl/live",
  },
  {
    channelId: LOFI_SYNTHWAVE_CHANNEL_ID,
    label: "Synthwave radio",
    channel: "Lofi Girl Synthwave",
    watchUrl: "https://www.youtube.com/channel/UCc5afI6TobiZjRke2sYBDPA/live",
  },
] as const;

function youtubeLiveEmbedSrc(channelId: string): string {
  const params = new URLSearchParams({
    autoplay: "1",
    mute: "0",
    rel: "0",
    modestbranding: "1",
  });
  return `https://www.youtube.com/embed/live_stream?channel=${channelId}&${params}`;
}

// Spotify editorial playlists (embed URLs verified May 2026)
const SPOTIFY_PLAYLISTS = [
  // Meditation playlists (default)
  { uri: "37i9dQZF1DWZqd5JICZI0u", label: "Peaceful Meditation", desc: "Calming meditation music" },
  { uri: "37i9dQZF1DX9uKNf5jGX6m", label: "Meditation", desc: "Mindfulness & meditation" },
  { uri: "37i9dQZF1DWXe9gFZP0gtP", label: "Peaceful Guitar", desc: "Serene acoustic meditation" },
  // Groove Salad vibes — ambient/downtempo/chillout
  { uri: "37i9dQZF1DX3Ogo9pFvBkY", label: "Ambient Relaxation", desc: "Groove Salad vibes" },
  { uri: "37i9dQZF1DWZeKCadgRdKQ", label: "Deep Focus", desc: "Ambient focus" },
  { uri: "37i9dQZF1DX1n9whBbBKoL", label: "Floating Through Space", desc: "Deep space ambient" },
  { uri: "37i9dQZF1DX6VdMW310YC7", label: "Chill Tracks", desc: "Downtempo electronic" },
  // Suburbs of Goa vibes — Indian indie / lofi
  { uri: "37i9dQZF1DX5q67ZpWyRrZ", label: "Indie India", desc: "Suburbs of Goa vibes" },
  { uri: "37i9dQZF1DWYoYGBbGKurt", label: "Lofi Chill", desc: "Chill beats to study to" },
];

// SoundCloud playlists — HTTP + widget checked May 2026. Prefer Lofi Girl official sets.
const SOUNDCLOUD_PLAYLISTS = [
  { url: "https://soundcloud.com/prabhdyal-singh-rai/sets/indian-classical-instrumental", label: "Indian Classical", desc: "Santoor, Flute & Sitar \u2022 44 tracks" },
  { url: "https://soundcloud.com/abhijeet-mokal-abhi/sets/instrumental-different", label: "Indian Ragas", desc: "Ravi Shankar, Zakir Hussain \u2022 43 tracks" },
  { url: "https://soundcloud.com/gurgeet-singh/sets/indian-classical-instrumental", label: "Indian Instrumental", desc: "Sarangi, Tabla & more \u2022 75 tracks" },
  { url: "https://soundcloud.com/lofi_girl/sets/peaceful-piano-music-to-focus", label: "Peaceful Piano", desc: "Lofi Girl \u2022 330 tracks \u2022 focus/study" },
  { url: "https://soundcloud.com/lofi_girl/sets/lofi-hiphop", label: "Lo-fi Hip Hop", desc: "Lofi Girl \u2022 217 tracks" },
  { url: "https://soundcloud.com/lofi_girl/sets/chill-guitar", label: "Chill Guitar", desc: "Lofi Girl \u2022 122 tracks" },
  { url: "https://soundcloud.com/lofi_girl/sets/synthwave-ambient-chill-music", label: "Synth Ambient", desc: "Lofi Girl \u2022 37 tracks" },
  { url: "https://soundcloud.com/lofi_girl/sets/dark-ambient-music-to-escape", label: "Dark Ambient", desc: "Lofi Girl \u2022 music to escape/dream to" },
];

// SomaFM stations for external linking (embedding prohibited by TOS)
const SOMAFM_STATIONS = [
  { slug: "groovesalad", label: "Groove Salad", desc: "Ambient/downtempo" },
  { slug: "suburbsofgoa", label: "Suburbs of Goa", desc: "World/Indian electronica" },
];

function createRainSound(ctx: AudioContext, dest: AudioNode) {
  // Rain = filtered noise bursts with random modulation
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < bufferSize; i++) {
      // Rain-like texture: noise with amplitude modulation
      const envelope = 0.3 + 0.7 * Math.pow(Math.random(), 3);
      data[i] = (Math.random() * 2 - 1) * envelope;
    }
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  // Bandpass filter to shape rain frequencies
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 800;
  filter.Q.value = 0.5;

  // Slight highpass for realism
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 200;

  source.connect(filter);
  filter.connect(hp);
  hp.connect(dest);
  source.start();
  return source;
}

function createWhiteNoise(ctx: AudioContext, dest: AudioNode) {
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  source.connect(dest);
  source.start();
  return source;
}

function createBrownNoise(ctx: AudioContext, dest: AudioNode) {
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    let last = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5; // Boost amplitude
    }
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  source.connect(dest);
  source.start();
  return source;
}

function createCafeSound(ctx: AudioContext, dest: AudioNode) {
  // Café: muffled room chatter + dish clinks — avoid slow swells/low rumble that read as ocean waves.
  const bufferSize = ctx.sampleRate * 4;
  const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    let pink = 0;
    let murmur = 0.55;
    let clinkHold = 0;
    let clinkAmp = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      pink = (pink + 0.02 * white) / 1.02;

      // Random-walk envelope: conversational lulls and bursts, not periodic waves.
      if (Math.random() < 0.0018) murmur += (Math.random() - 0.48) * 0.22;
      murmur = Math.max(0.25, Math.min(0.95, murmur));

      // Occasional cup/dish clink.
      if (clinkHold > 0) {
        clinkHold--;
        clinkAmp *= 0.92;
      } else if (Math.random() < 0.00012) {
        clinkHold = Math.floor(ctx.sampleRate * (0.02 + Math.random() * 0.04));
        clinkAmp = 0.25 + Math.random() * 0.2;
      }
      const clink = white * clinkAmp;

      // Light hiss for espresso/AC room tone (kept subtle).
      const hiss = white * 0.06;

      data[i] = pink * 1.8 * murmur + clink + hiss;
    }
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const highpass = ctx.createBiquadFilter();
  highpass.type = "highpass";
  highpass.frequency.value = 320;

  const bandpass = ctx.createBiquadFilter();
  bandpass.type = "bandpass";
  bandpass.frequency.value = 1400;
  bandpass.Q.value = 0.45;

  const lowpass = ctx.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = 3800;

  source.connect(highpass);
  highpass.connect(bandpass);
  bandpass.connect(lowpass);
  lowpass.connect(dest);
  source.start();
  return source;
}

function startSound(
  ctx: AudioContext,
  type: SoundType,
  gain: GainNode
): AudioBufferSourceNode {
  switch (type) {
    case "rain":
      return createRainSound(ctx, gain);
    case "whitenoise":
      return createWhiteNoise(ctx, gain);
    case "brownnoise":
      return createBrownNoise(ctx, gain);
    case "cafe":
      return createCafeSound(ctx, gain);
    default:
      return createWhiteNoise(ctx, gain);
  }
}

interface AmbientSoundsProps {
  /** Fits in the status-bar focus strip instead of below the timer panel. */
  inline?: boolean;
  /** Sits inside the combined focus card (no separate border/background). */
  embedded?: boolean;
}

const FOCUS_STRIP_ICON_BTN =
  "p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1a2d4a] transition-colors";
const FOCUS_STRIP_VALUE =
  "text-xs sm:text-sm font-medium leading-tight text-slate-700 dark:text-slate-200";

export default function AmbientSounds({ inline = false, embedded = false }: AmbientSoundsProps) {
  const stripEmbedded = inline && embedded;
  const [mode, setMode] = useState<"sounds" | "spotify" | "soundcloud" | "lofi">("sounds");
  const [activeSound, setActiveSound] = useState<SoundType | null>(null);
  const [volume, setVolume] = useState(0.5);
  const [ytStreamIdx, setYtStreamIdx] = useState(0);
  const [showYt, setShowYt] = useState(false);
  const [spotifyIdx, setSpotifyIdx] = useState(0);
  const [scIdx, setScIdx] = useState(0);
  const [scShuffle, setScShuffle] = useState(false);
  const [scError, setScError] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  useEffect(() => {
    setMode(getAmbientMode());
    setVolume(getAmbientVolume());
    setPrefsLoaded(true);
  }, []);

  useEffect(() => {
    if (!prefsLoaded) return;
    setAmbientMode(mode as AmbientMode);
  }, [mode, prefsLoaded]);

  useEffect(() => {
    if (!prefsLoaded) return;
    setAmbientVolume(volume);
  }, [volume, prefsLoaded]);

  useEffect(() => {
    if (!prefsLoaded) return;
    setAmbientSound(activeSound);
  }, [activeSound, prefsLoaded]);

  // Auto-skip to next playlist if SoundCloud widget reports an error
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.origin !== "https://w.soundcloud.com") return;
      try {
        const data = JSON.parse(e.data as string);
        if (data.method === "error") {
          setScError(true);
        }
      } catch {}
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Reset error flag when playlist changes
  useEffect(() => { setScError(false); }, [scIdx]);

  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const scIframeRef = useRef<HTMLIFrameElement | null>(null);

  // Send a command to the SoundCloud Widget via postMessage
  const scCommand = useCallback((method: string, value?: unknown) => {
    const iframe = scIframeRef.current;
    if (!iframe?.contentWindow) return;
    const msg: Record<string, unknown> = { method };
    if (value !== undefined) msg.value = value;
    iframe.contentWindow.postMessage(
      JSON.stringify(msg),
      "https://w.soundcloud.com"
    );
  }, []);

  const stopSound = useCallback(() => {
    if (sourceRef.current) {
      sourceRef.current.stop();
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
  }, []);

  const playSound = useCallback(
    (type: SoundType) => {
      // If tapping the same sound → toggle off
      if (activeSound === type) {
        trackSoundStopped(type);
        stopSound();
        setActiveSound(null);
        return;
      }

      stopSound();
      trackSoundPlayed(type);

      if (!ctxRef.current) {
        ctxRef.current = new AudioContext();
        const g = ctxRef.current.createGain();
        g.gain.value = volume;
        g.connect(ctxRef.current.destination);
        gainRef.current = g;
      }

      if (ctxRef.current.state === "suspended") {
        ctxRef.current.resume();
      }

      if (gainRef.current) {
        gainRef.current.gain.value = volume;
      }

      sourceRef.current = startSound(ctxRef.current, type, gainRef.current!);
      setActiveSound(type);
    },
    [activeSound, volume, stopSound]
  );

  // Update gain when volume changes
  useEffect(() => {
    if (gainRef.current) {
      gainRef.current.gain.value = volume;
    }
  }, [volume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      sourceRef.current?.stop();
      ctxRef.current?.close();
    };
  }, []);

  const ytStream = YOUTUBE_STREAMS[ytStreamIdx];
  const spotifyPlaylist = SPOTIFY_PLAYLISTS[spotifyIdx];
  const scPlaylist = SOUNDCLOUD_PLAYLISTS[scIdx];
  const activeSoundMeta = SOUNDS.find((s) => s.id === activeSound);
  const lastSoundMeta = prefsLoaded
    ? SOUNDS.find((s) => s.id === getAmbientSound()) ?? null
    : null;

  const nowPlayingLabel =
    mode === "sounds"
      ? activeSoundMeta
        ? `${activeSoundMeta.emoji} ${activeSoundMeta.label}`
        : lastSoundMeta
          ? `${lastSoundMeta.emoji} ${lastSoundMeta.label}`
          : "Ambient sounds"
      : mode === "soundcloud"
        ? scPlaylist.label
        : mode === "spotify"
          ? spotifyPlaylist.label
          : ytStream.label;

  const handleMiniPlayPause = (e: MouseEvent) => {
    e.stopPropagation();
    if (mode === "sounds") {
      if (activeSound) {
        playSound(activeSound);
      } else {
        const saved = getAmbientSound();
        const last: SoundType =
          saved && SOUNDS.some((s) => s.id === saved) ? saved : "brownnoise";
        playSound(last);
      }
      return;
    }
    if (mode === "soundcloud") {
      scCommand("toggle");
      return;
    }
    setCollapsed(false);
    if (mode === "lofi" && !showYt) setShowYt(true);
  };

  return (
    <div
      id="ambient-sounds"
      className={
        stripEmbedded
          ? "w-full min-w-0 flex flex-col scroll-mt-24 relative"
          : inline
            ? `${collapsed ? "flex-shrink-0" : "w-full basis-full"} space-y-1.5 scroll-mt-24`
            : "mx-2 sm:mx-3 mb-2 space-y-1.5 scroll-mt-24"
      }
    >
      {/* Mini player bar (always visible) */}
      <div
        className={`flex items-center gap-1.5 transition-colors ${
          stripEmbedded
            ? "w-full min-w-0 flex-1 min-h-[2.75rem] px-0 py-0"
            : inline
              ? "w-fit max-w-full px-2 sm:px-2.5 py-1.5 rounded-xl border shadow-sm"
              : "px-2 sm:px-2.5 py-1.5 rounded-xl border shadow-sm"
        } ${
          stripEmbedded
            ? ""
            : activeSound || (mode === "soundcloud") || showYt
              ? "bg-slate-50 dark:bg-[#131d30] border-slate-300 dark:border-[#3a5070] ring-1 ring-cyan-400/20 dark:ring-cyan-500/25"
              : "bg-slate-100 dark:bg-[#131d30] border-slate-200 dark:border-[#243350]"
        }`}
      >
        {!stripEmbedded && (
        <button
          type="button"
          onClick={handleMiniPlayPause}
          className={`flex-shrink-0 ${miniPlayButtonClass(
            !!(mode === "sounds" && activeSound) || (mode === "soundcloud" && !collapsed) || showYt
          )}`}
          aria-label={
            mode === "sounds"
              ? activeSound
                ? `Pause ${activeSoundMeta?.label}`
                : "Play ambient sound"
              : mode === "soundcloud"
                ? "Play or pause SoundCloud"
                : "Open player"
          }
          title={mode === "sounds" ? (activeSound ? "Pause" : "Play") : mode === "soundcloud" ? "Play / Pause" : "Expand to play"}
        >
          <MiniPlayPauseIcon playing={mode === "sounds" && !!activeSound} />
        </button>
        )}

        {mode === "soundcloud" && collapsed && (
          <>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); scCommand("prev"); }}
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-[#1a2d4a] touch-target-sm"
              aria-label="Previous track"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); scCommand("next"); }}
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-[#1a2d4a] touch-target-sm"
              aria-label="Next track"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className={`min-w-0 flex-1 text-left ${stripEmbedded ? "max-w-none" : "max-w-[8rem] sm:max-w-[10rem]"}`}
          aria-label={collapsed ? "Expand music panel" : "Music and sounds"}
        >
          {stripEmbedded ? (
            <span className="flex items-baseline gap-1.5 min-w-0">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 leading-none shrink-0">
                Music
              </span>
              <span className={`${FOCUS_STRIP_VALUE} truncate min-w-0`}>{nowPlayingLabel}</span>
            </span>
          ) : (
            <>
              <span className="app-section-label text-slate-500 dark:text-slate-400">
                {collapsed ? "Music" : "Now playing"}
              </span>
              <span className="block text-sm font-medium text-slate-800 dark:text-slate-100 truncate leading-tight">
                {nowPlayingLabel}
              </span>
            </>
          )}
        </button>

        {mode === "sounds" && activeSound && collapsed && (
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            onClick={(e) => e.stopPropagation()}
            className={`${stripEmbedded ? "hidden sm:block w-12" : ""} w-14 sm:w-16 h-1 accent-blue-500 dark:accent-blue-400 flex-shrink-0`}
            aria-label="Volume"
          />
        )}

        {stripEmbedded && (
          <button
            type="button"
            onClick={handleMiniPlayPause}
            className={`flex-shrink-0 ${miniPlayButtonClass(
              !!(mode === "sounds" && activeSound) || (mode === "soundcloud" && !collapsed) || showYt,
              true
            )}`}
            aria-label={
              mode === "sounds"
                ? activeSound
                  ? `Pause ${activeSoundMeta?.label}`
                  : "Play ambient sound"
                : mode === "soundcloud"
                  ? "Play or pause SoundCloud"
                  : "Open player"
            }
            title={mode === "sounds" ? (activeSound ? "Pause" : "Play") : mode === "soundcloud" ? "Play / Pause" : "Expand to play"}
          >
            <MiniPlayPauseIcon playing={mode === "sounds" && !!activeSound} />
          </button>
        )}

        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className={`flex-shrink-0 touch-target-sm flex items-center gap-0.5 ${
            stripEmbedded ? FOCUS_STRIP_ICON_BTN : "p-1.5 rounded-lg text-slate-400 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-[#1a2d4a]"
          }`}
          aria-label={collapsed ? "Expand music library" : "Collapse music library"}
          aria-expanded={!collapsed}
          title={collapsed ? "Expand music library" : "Collapse music library"}
        >
          {stripEmbedded && (
            <svg className="w-3 h-3 opacity-60" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M9 3v10.55A4 4 0 1 0 11 17V7h4V3H9z"/>
            </svg>
          )}
          <svg
            className="w-4 h-4 transition-transform duration-200"
            style={{ transform: collapsed ? "rotate(0deg)" : "rotate(180deg)" }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* SoundCloud embed stays mounted when collapsed so mini player controls work */}
      {mode === "soundcloud" && (
        <div
          className={collapsed ? "h-0 overflow-hidden opacity-0 pointer-events-none" : ""}
          aria-hidden={collapsed}
        >
          <iframe
            key={scIdx}
            ref={scIframeRef}
            width="100%"
            height={stripEmbedded ? 80 : 120}
            scrolling="no"
            frameBorder="no"
            allow="autoplay"
            src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(scPlaylist.url)}&color=%23334155&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`}
            title={scPlaylist.label}
            className="border-0"
            tabIndex={collapsed ? -1 : 0}
          />
        </div>
      )}

      <div
        className={
          collapsed
            ? "hidden"
            : stripEmbedded
              ? "absolute right-0 top-[calc(100%+0.25rem)] z-50 w-[22rem] max-w-[calc(100vw-2rem)] space-y-1.5 rounded-xl border border-slate-200/90 dark:border-[#243350] bg-white dark:bg-[#131d30] p-2.5 shadow-lg shadow-slate-900/10"
              : inline
                ? "space-y-1.5"
                : "space-y-2"
        }
      >
      {/* Mode toggle — single-line icon + label (SoundCloud must not wrap) */}
      <div className="flex items-stretch gap-0.5 sm:gap-1 bg-slate-100 dark:bg-[#131d30] rounded-lg p-0.5 border border-slate-200 dark:border-[#243350]">
        {(
          [
            {
              id: "sounds" as const,
              onClick: () => {
                setMode("sounds");
                setShowYt(false);
              },
              label: "Sounds",
              icon: <span className="text-sm leading-none shrink-0" aria-hidden>🎧</span>,
            },
            {
              id: "spotify" as const,
              onClick: () => setMode("spotify"),
              label: "Spotify",
              icon: (
                <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                </svg>
              ),
            },
            {
              id: "soundcloud" as const,
              onClick: () => setMode("soundcloud"),
              label: "Cloud",
              labelWide: "SoundCloud",
              icon: <span className="text-sm leading-none shrink-0" aria-hidden>☁️</span>,
            },
            {
              id: "lofi" as const,
              onClick: () => setMode("lofi"),
              label: "Lo-fi",
              icon: <span className="text-sm leading-none shrink-0" aria-hidden>📺</span>,
            },
          ] as const
        ).map((tab) => {
          const active = mode === tab.id;
          const modeTabClass = `flex-1 min-w-0 inline-flex items-center justify-center gap-1 px-1.5 sm:px-2 ${
            stripEmbedded ? "py-2" : "py-1.5"
          } text-xs font-medium rounded-md transition-colors whitespace-nowrap leading-none ${
            active
              ? "bg-white dark:bg-[#1a2d4a] text-slate-800 dark:text-slate-100 shadow-sm ring-1 ring-slate-300/70 dark:ring-[#3a5070]"
              : "text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100"
          }`;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={tab.onClick}
              className={modeTabClass}
              title={"labelWide" in tab ? tab.labelWide : tab.label}
            >
              {tab.icon}
              {"labelWide" in tab ? (
                <>
                  <span className="truncate sm:hidden">{tab.label}</span>
                  <span className="truncate hidden sm:inline">{tab.labelWide}</span>
                </>
              ) : (
                <span className="truncate">{tab.label}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Ambient Sounds mode */}
      {mode === "sounds" && (
        <div
          className={`bg-slate-100 dark:bg-[#131d30] rounded-lg border border-slate-200 dark:border-[#243350] ${
            stripEmbedded ? "px-2 py-2" : inline ? "px-2 py-2" : "px-3 py-3"
          }`}
        >
          <div
            className={`grid ${stripEmbedded ? "gap-1.5 mb-1" : inline ? "gap-1.5 grid-cols-4 mb-1" : "gap-1.5 grid-cols-3 sm:grid-cols-4 mb-2"} ${
              stripEmbedded || inline ? "grid-cols-4" : ""
            }`}
          >
            {SOUNDS.map((s) => (
              <button
                key={s.id}
                onClick={() => playSound(s.id)}
                className={`flex flex-col items-center gap-0.5 rounded-lg font-medium transition-all ${
                  stripEmbedded ? "py-2 px-1.5 text-xs" : inline ? "py-1 px-0.5 text-xs" : "py-2 px-1 text-xs"
                } ${
                  activeSound === s.id
                    ? "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 ring-1 ring-cyan-300 dark:ring-cyan-700"
                    : "bg-white dark:bg-[#1a2d4a] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#243350]"
                }`}
                aria-label={`${activeSound === s.id ? "Stop" : "Play"} ${s.label}`}
              >
                <span className={stripEmbedded ? "text-lg leading-none" : "text-lg"}>{s.emoji}</span>
                <span className="truncate w-full text-center leading-tight">{s.label}</span>
              </button>
            ))}
          </div>
          {/* Volume control — only show when a sound is active */}
          {activeSound && (
            <div className="flex items-center gap-2 pt-1 border-t border-slate-200 dark:border-[#243350]">
              <svg className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
              </svg>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="flex-1 h-1 accent-blue-500 dark:accent-blue-400"
                aria-label="Volume"
              />
              <span className="text-xs text-slate-400 dark:text-slate-400 w-7 text-right">
                {Math.round(volume * 100)}%
              </span>
            </div>
          )}
        </div>
      )}

      {/* Lo-fi Radio mode (YouTube embed) */}
      {mode === "lofi" && (
        <div className="bg-slate-100 dark:bg-[#131d30] rounded-xl border border-slate-200 dark:border-[#243350] overflow-hidden">
          {showYt ? (
            <div className={stripEmbedded ? "h-24" : "aspect-video"}>
              <iframe
                key={ytStream.channelId}
                src={youtubeLiveEmbedSrc(ytStream.channelId)}
                title={ytStream.label}
                allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          ) : (
            <div className={`text-center ${stripEmbedded ? "p-2" : "p-4"}`}>
              <p className={`text-slate-600 dark:text-slate-300 mb-2 ${stripEmbedded ? "text-xs mb-1.5" : "text-sm mb-3"}`}>
                Stream lo-fi music from YouTube
              </p>
              <button
                onClick={() => setShowYt(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0C.488 3.45.029 5.804 0 12c.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0C23.512 20.55 23.971 18.196 24 12c-.029-6.185-.484-8.549-4.385-8.816zM9 16V8l8 4-8 4z" />
                </svg>
                Play {ytStream.label}
              </button>
            </div>
          )}
          {/* Stream selector */}
          <div className="flex items-center justify-between px-3 py-2 border-t border-slate-200 dark:border-[#243350] gap-2">
            <button
              onClick={() => {
                setYtStreamIdx((i) => (i - 1 + YOUTUBE_STREAMS.length) % YOUTUBE_STREAMS.length);
                setShowYt(false);
              }}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors p-1"
              aria-label="Previous stream"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
            </button>
            <div className="text-center min-w-0">
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate block">
                {ytStream.label}
              </span>
              <span className="text-xs sm:text-sm text-slate-400 dark:text-slate-300">
                {ytStream.channel}
              </span>
            </div>
            <button
              onClick={() => {
                setYtStreamIdx((i) => (i + 1) % YOUTUBE_STREAMS.length);
                setShowYt(false);
              }}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors p-1"
              aria-label="Next stream"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/></svg>
            </button>
          </div>
          <a
            href={ytStream.watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block px-3 pb-2 text-xs text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
          >
            Open on YouTube if the player shows an error
          </a>
        </div>
      )}

      {/* Spotify mode */}
      {mode === "spotify" && (
        <div className="bg-slate-100 dark:bg-[#131d30] rounded-xl border border-slate-200 dark:border-[#243350] overflow-hidden">
          <iframe
            src={`https://open.spotify.com/embed/playlist/${spotifyPlaylist.uri}?utm_source=generator&theme=0`}
            width="100%"
            height={stripEmbedded ? 80 : 120}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="border-0"
            title={spotifyPlaylist.label}
          />
          {/* Playlist selector */}
          <div
            className={`flex items-center justify-between border-t border-slate-200 dark:border-[#243350] ${
              stripEmbedded ? "px-2 py-1" : "px-3 py-2"
            }`}
          >
            <button
              onClick={() => setSpotifyIdx((i) => (i - 1 + SPOTIFY_PLAYLISTS.length) % SPOTIFY_PLAYLISTS.length)}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors p-1"
              aria-label="Previous playlist"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
            </button>
            <div className="text-center min-w-0">
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate block">
                {spotifyPlaylist.label}
              </span>
              <span className="text-xs sm:text-sm text-slate-400 dark:text-slate-300">
                {spotifyPlaylist.desc}
              </span>
            </div>
            <button
              onClick={() => setSpotifyIdx((i) => (i + 1) % SPOTIFY_PLAYLISTS.length)}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors p-1"
              aria-label="Next playlist"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/></svg>
            </button>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center pb-2 px-3">
            Log in to Spotify for full tracks
          </p>
        </div>
      )}

      {/* SoundCloud mode (embed lives above so it stays mounted when collapsed) */}
      {mode === "soundcloud" && (
        <div className="bg-slate-100 dark:bg-[#131d30] rounded-xl border border-slate-200 dark:border-[#243350] overflow-hidden">
          {scError && (
            <div className="flex items-center justify-between px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-200 dark:border-amber-800/40">
              <span className="text-xs text-amber-700 dark:text-amber-400">Playlist unavailable</span>
              <button
                onClick={() => setScIdx((i) => (i + 1) % SOUNDCLOUD_PLAYLISTS.length)}
                className="text-xs font-medium text-amber-700 dark:text-amber-400 hover:underline"
              >
                Try next →
              </button>
            </div>
          )}
          {/* Track skip controls */}
          <div className="flex items-center justify-center gap-3 px-3 py-2 border-t border-slate-200 dark:border-[#243350]">
            <button
              onClick={() => scCommand("prev")}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors p-2"
              aria-label="Previous track"
              title="Previous track"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
            </button>
            <button
              onClick={() => scCommand("toggle")}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors p-2"
              aria-label="Play / Pause"
              title="Play / Pause"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </button>
            <button
              onClick={() => scCommand("next")}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors p-2"
              aria-label="Next track"
              title="Next track"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
            </button>
            <button
              onClick={() => {
                const next = !scShuffle;
                setScShuffle(next);
                scCommand("setShuffle", next);
              }}
              className={`p-2 transition-colors ${
                scShuffle
                  ? "text-cyan-500 dark:text-cyan-400"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
              aria-label="Shuffle"
              title={scShuffle ? "Shuffle on" : "Shuffle off"}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>
            </button>
          </div>
          {/* Playlist selector */}
          <div className="flex items-center justify-between px-3 py-2 border-t border-slate-200 dark:border-[#243350]">
            <button
              onClick={() => setScIdx((i) => (i - 1 + SOUNDCLOUD_PLAYLISTS.length) % SOUNDCLOUD_PLAYLISTS.length)}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors p-1"
              aria-label="Previous playlist"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
            </button>
            <div className="text-center min-w-0">
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate block">
                {scPlaylist.label}
              </span>
              <span className="text-xs sm:text-sm text-slate-400 dark:text-slate-300">
                {scPlaylist.desc}
              </span>
            </div>
            <button
              onClick={() => setScIdx((i) => (i + 1) % SOUNDCLOUD_PLAYLISTS.length)}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors p-1"
              aria-label="Next playlist"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* SomaFM external links */}
      <div className="flex items-center gap-1.5 flex-nowrap min-w-0 overflow-x-auto pb-0.5">
        <span
          className={`${stripEmbedded ? "text-xs sm:text-sm" : "text-sm"} font-medium text-slate-500 dark:text-slate-300 shrink-0`}
        >
          SomaFM:
        </span>
        {SOMAFM_STATIONS.map((s) => (
          <a
            key={s.slug}
            href={`https://somafm.com/player/#/now-playing/${s.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1 whitespace-nowrap shrink-0 rounded-md bg-slate-100 dark:bg-[#131d30] border border-slate-200 dark:border-[#243350] text-slate-600 dark:text-slate-300 hover:text-slate-700 dark:hover:text-slate-100 hover:border-slate-300 dark:hover:border-[#3a5070] transition-colors ${
              stripEmbedded ? "px-2 py-1 text-xs sm:text-sm font-medium" : "px-2.5 py-1 text-sm font-medium gap-1.5"
            }`}
            title={s.desc}
          >
            <svg className="w-2.5 h-2.5 opacity-60 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
            {s.label}
          </a>
        ))}
      </div>
      </div>
    </div>
  );
}
