"use client";

import { useState, useEffect } from "react";

interface WeatherData {
  temp: number;
  description: string;
  icon: string;
  city: string;
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

export default function WeatherTime() {
  const [now, setNow] = useState(new Date());
  const [weather, setWeather] = useState<WeatherData | null>(null);

  // Update clock every minute
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Fetch weather from our own API route (server-side, no CORS/ad-blocker issues)
  useEffect(() => {
    let cancelled = false;

    fetch("/api/weather")
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
          });
        }
      })
      .catch(() => {
        // Failed — just show clock
      });

    return () => { cancelled = true; };
  }, []);

  const greeting = getGreeting(now.getHours());

  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/80 dark:bg-[#111827] backdrop-blur-sm border border-slate-200 dark:border-[#1e3050] shadow-sm mb-3 sm:mb-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {greeting}
        </p>
        <p className="text-lg font-semibold text-slate-800 dark:text-slate-100 tabular-nums">
          {formatClock(now)}
          <span className="ml-2 text-sm font-normal text-slate-400 dark:text-slate-400">
            {formatDate(now)}
          </span>
        </p>
      </div>
      {weather && (
        <div className="flex items-center gap-2 flex-shrink-0 text-right">
          <span className="text-2xl" title={weather.description}>
            {weather.icon}
          </span>
          <div>
            <p className="text-lg font-semibold text-slate-800 dark:text-slate-100 tabular-nums">
              {weather.temp}°F
            </p>
            {weather.city && (
              <p className="text-xs text-slate-400 dark:text-slate-400 truncate max-w-[120px]">
                {weather.city}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
