"use client";

import { useState, useEffect } from "react";

interface WeatherData {
  temp: number;
  description: string;
  icon: string;
  city: string;
  unit: "fahrenheit" | "celsius";
}

const ICON_MAP: Record<string, string> = {
  clear: "☀️",
  cloudy: "⛅",
  fog: "🌫️",
  drizzle: "🌦️",
  rain: "🌧️",
  snow: "🌨️",
  storm: "⛈️",
  unknown: "🌡️",
};

function formatClock(date: Date): string {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
}

function getGreeting(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

interface WeatherTimeProps {
  /** Single-line layout for /app to save vertical space. */
  compact?: boolean;
}

export default function WeatherTime({ compact = false }: WeatherTimeProps) {
  const [now, setNow] = useState(new Date());
  const [weather, setWeather] = useState<WeatherData | null>(null);

  // Detect locale preference for temperature unit
  const prefersCelsius = typeof navigator !== "undefined"
    && !navigator.language?.startsWith("en-US");

  // Update clock every minute
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Fetch weather from our own API route (server-side, no CORS/ad-blocker issues)
  useEffect(() => {
    let cancelled = false;

    fetch(`/api/weather${prefersCelsius ? "?unit=celsius" : ""}`)
      .then((res) => {
        if (!res.ok) throw new Error("Weather API error");
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        if (data.temp != null) {
          setWeather({
            temp: data.temp,
            description: data.description,
            icon: ICON_MAP[data.icon] || "🌡️",
            city: data.city || "",
            unit: data.unit || "fahrenheit",
          });
        }
      })
      .catch(() => {
        // Failed — just show clock
      });

    return () => { cancelled = true; };
  }, []);

  const greeting = getGreeting(now.getHours());

  if (compact) {
    return (
      <div className="flex items-center gap-2 min-h-[3.5rem] min-w-0 w-full h-full px-3 py-2 rounded-xl border border-slate-200/90 dark:border-[#243350] bg-white/80 dark:bg-[#131d30]/90 shadow-sm overflow-hidden">
        <span className="flex items-center gap-1.5 shrink-0">
          <span className="app-section-label text-slate-500 dark:text-slate-400 shrink-0">Time</span>
          <span className="text-base sm:text-lg font-semibold tabular-nums leading-none text-slate-800 dark:text-slate-100 whitespace-nowrap">
            {formatClock(now)}
          </span>
        </span>
        {weather && (
          <span
            className="flex items-center gap-1.5 min-w-0 flex-1 justify-end overflow-hidden"
            title={`${weather.description}${weather.city ? ` · ${weather.city}` : ""}`}
          >
            <span className="text-base sm:text-lg leading-none shrink-0" aria-hidden>
              {weather.icon}
            </span>
            <span className="text-base sm:text-lg font-semibold tabular-nums leading-none text-slate-800 dark:text-slate-100 whitespace-nowrap shrink-0">
              {weather.temp}°{weather.unit === "celsius" ? "C" : "F"}
            </span>
            {weather.city && (
              <span className="text-sm sm:text-base font-medium leading-none text-slate-600 dark:text-slate-300 truncate min-w-0 pr-0.5">
                {weather.city}
              </span>
            )}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-3 sm:px-4 py-2 rounded-xl app-surface dark:bg-[#111827] dark:border-[#1e3050] mb-3 sm:mb-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-300 truncate">
          {greeting}
        </p>
        <p className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-100 tabular-nums leading-tight">
          {formatClock(now)}
          <span className="ml-2 text-xs sm:text-sm font-normal text-slate-400 dark:text-slate-300 hidden sm:inline">
            {formatDate(now)}
          </span>
        </p>
      </div>
      {weather && (
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 text-right min-w-0 max-w-[50%]">
          <span className="text-lg sm:text-xl shrink-0" title={weather.description}>
            {weather.icon}
          </span>
          <div className="flex items-center gap-1 text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100 tabular-nums min-w-0">
            <span className="shrink-0">
              {weather.temp}°{weather.unit === "celsius" ? "C" : "F"}
            </span>
            {weather.city && (
              <p className="text-xs sm:text-sm font-normal text-slate-500 dark:text-slate-300 truncate min-w-0">
                {weather.city}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
