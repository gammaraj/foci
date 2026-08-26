"use client";

import { useState, useEffect } from "react";

interface WeatherData {
  temp: number;
  high?: number;
  low?: number;
  humidity?: number;
  wind?: number;
  windUnit?: "mph" | "kmh";
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

function formatShortWeekday(date: Date): string {
  return date.toLocaleDateString([], { weekday: "short" });
}

function windLabel(unit?: WeatherData["windUnit"]): string {
  return unit === "kmh" ? "km/h" : "mph";
}

/** Quiet clock + condition for the navbar center. */
export default function WeatherTime() {
  const [now, setNow] = useState(new Date());
  const [weather, setWeather] = useState<WeatherData | null>(null);

  const prefersCelsius =
    typeof navigator !== "undefined" && !navigator.language?.startsWith("en-US");

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

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
            high: data.high,
            low: data.low,
            humidity: data.humidity,
            wind: data.wind,
            windUnit: data.windUnit,
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

    return () => {
      cancelled = true;
    };
  }, [prefersCelsius]);

  const unitSuffix = weather?.unit === "celsius" ? "C" : "F";

  const weatherTitle = weather
    ? [
        weather.description,
        weather.city || null,
        weather.low != null && weather.high != null ? `Low ${weather.low}° · High ${weather.high}°` : null,
        weather.humidity != null ? `${weather.humidity}% humidity` : null,
        weather.wind != null ? `${weather.wind} ${windLabel(weather.windUnit)} wind` : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : "";

  return (
    <div
      className="nav-chrome-meta flex items-center justify-center gap-2.5 sm:gap-3 min-w-0 max-w-full"
      title={weatherTitle || undefined}
      aria-label={weatherTitle ? `Local time and weather: ${formatClock(now)}. ${weatherTitle}` : `Local time ${formatClock(now)}`}
    >
      <span className="text-[0.875rem] font-semibold tabular-nums text-slate-700 dark:text-slate-200 whitespace-nowrap tracking-tight">
        {formatClock(now)}
      </span>
      <span className="text-[0.75rem] font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap hidden sm:inline">
        {formatShortWeekday(now)}
      </span>
      {weather && (
        <>
          <span className="nav-chrome-divider w-px h-3.5 shrink-0 mx-1.5 sm:mx-2 rounded-full" aria-hidden />
          <span className="text-[0.875rem] leading-none shrink-0" aria-hidden>
            {weather.icon}
          </span>
          <span className="text-[0.875rem] font-semibold tabular-nums text-slate-700 dark:text-slate-200 whitespace-nowrap tracking-tight">
            {weather.temp}°{unitSuffix}
          </span>
          <span className="text-[0.75rem] font-medium text-slate-500 dark:text-slate-400 truncate min-w-0 hidden lg:inline max-w-[7rem]">
            {weather.description}
          </span>
          {weather.city && (
            <span className="text-[0.75rem] font-medium text-slate-500 dark:text-slate-400 truncate min-w-0 hidden xl:inline max-w-[6rem]">
              {weather.city}
            </span>
          )}
        </>
      )}
    </div>
  );
}
