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

function formatDate(date: Date): string {
  return date.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
}

function formatShortWeekday(date: Date): string {
  return date.toLocaleDateString([], { weekday: "short" });
}

function getGreeting(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function windLabel(unit?: WeatherData["windUnit"]): string {
  return unit === "kmh" ? "km/h" : "mph";
}

interface WeatherTimeProps {
  /** Single-line layout for /app to save vertical space. */
  compact?: boolean;
  /** Inside the combined focus strip — no separate card border. */
  embedded?: boolean;
  /** Quiet clock + condition for the navbar center. */
  nav?: boolean;
}

function WeatherStat({
  label,
  value,
  title,
  className = "inline-flex",
}: {
  label: string;
  value: string;
  title?: string;
  className?: string;
}) {
  return (
    <span
      className={`${className} flex-col items-center justify-center gap-1`}
      title={title}
    >
      <span className="text-xs font-semibold uppercase tracking-wide !leading-none text-slate-400 dark:text-slate-500">
        {label}
      </span>
      <span className="text-xs font-semibold tabular-nums !leading-none text-slate-600 dark:text-slate-300">
        {value}
      </span>
    </span>
  );
}

export default function WeatherTime({ compact = false, embedded = false, nav = false }: WeatherTimeProps) {
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

  const greeting = getGreeting(now.getHours());
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

  if (nav) {
    return (
      <div
        className="nav-chrome-meta flex items-center justify-center gap-1.5 min-w-0 max-w-full"
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
            <span className="h-3.5 w-px bg-slate-200/90 dark:bg-white/10 shrink-0 mx-0.5" aria-hidden />
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

  if (compact) {
    const chrome = embedded
      ? "min-h-[2.75rem] min-w-0 w-full h-full py-0 overflow-visible"
      : "min-h-[2.75rem] min-w-0 w-full h-full px-2 sm:px-2.5 py-1 rounded-xl border border-slate-200/90 dark:border-[#243350] bg-white/80 dark:bg-[#131d30]/90 shadow-sm overflow-hidden";

    // Embedded strip: clock + condition + compact stats (city truncated).
    if (embedded) {
      return (
        <div
          className={`flex items-center gap-1.5 sm:gap-2 w-full min-w-0 ${chrome}`}
          title={weatherTitle || undefined}
        >
          <div className="flex items-baseline gap-1.5 shrink-0">
            <span className="text-sm font-semibold tabular-nums leading-none text-slate-800 dark:text-slate-100 whitespace-nowrap">
              {formatClock(now)}
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-none hidden xl:inline">
              {formatShortWeekday(now)}
            </span>
          </div>

          {weather && (
            <>
              <span className="h-5 w-px bg-slate-200/80 dark:bg-[#243350] shrink-0" aria-hidden />
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                <span className="text-sm leading-none shrink-0" aria-hidden>
                  {weather.icon}
                </span>
                <span className="text-sm font-semibold tabular-nums leading-none text-slate-800 dark:text-slate-100 whitespace-nowrap">
                  {weather.temp}°{unitSuffix}
                </span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate min-w-0 hidden lg:inline max-w-[5.5rem]">
                  {weather.description}
                </span>
              </div>

              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 ml-auto overflow-hidden">
                {weather.low != null && weather.high != null && (
                  <>
                    {/* Mobile: single-line high/low — stacked labels collide with temp at narrow widths */}
                    <span className="sm:hidden text-xs font-semibold tabular-nums !leading-none text-slate-600 dark:text-slate-300 whitespace-nowrap shrink-0">
                      {weather.low}°–{weather.high}°
                    </span>
                    <WeatherStat
                      className="hidden sm:inline-flex"
                      label="Today"
                      value={`${weather.low}°–${weather.high}°`}
                    />
                  </>
                )}
                {weather.humidity != null && (
                  <WeatherStat
                    className="hidden sm:inline-flex"
                    label="Humid"
                    value={`${weather.humidity}%`}
                    title="Relative humidity"
                  />
                )}
                {weather.wind != null && (
                  <WeatherStat
                    className="hidden md:inline-flex"
                    label="Wind"
                    value={`${weather.wind} ${windLabel(weather.windUnit)}`}
                    title="Wind speed"
                  />
                )}
                {weather.city && (
                  <span
                    className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate min-w-0 max-w-[4.5rem] sm:max-w-[5.5rem] xl:max-w-[7rem]"
                    title={weather.city}
                  >
                    {weather.city}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      );
    }

    return (
      <div
        className={`flex items-center gap-3 w-full min-w-0 ${chrome}`}
        title={weatherTitle || undefined}
      >
        <div className="flex flex-col shrink-0 justify-center">
          <span className="text-sm sm:text-base font-semibold tabular-nums leading-none text-slate-800 dark:text-slate-100 whitespace-nowrap">
            {formatClock(now)}
          </span>
        </div>

        {weather && (
          <>
            <span className="h-6 w-px bg-slate-200/80 dark:bg-[#243350] shrink-0" aria-hidden />

            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <span className="text-sm leading-none shrink-0" aria-hidden>
                {weather.icon}
              </span>
              <div className="min-w-0">
                <div className="flex items-baseline gap-1.5 leading-none">
                  <span className="text-sm sm:text-base font-semibold tabular-nums text-slate-800 dark:text-slate-100 whitespace-nowrap">
                    {weather.temp}°{unitSuffix}
                  </span>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate hidden sm:inline">
                    {weather.description}
                  </span>
                </div>
                {weather.city && (
                  <span
                    className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate max-w-[5.5rem] block mt-0.5"
                    title={weather.city}
                  >
                    {weather.city}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 ml-auto">
              {weather.low != null && weather.high != null && (
                <WeatherStat label="Today" value={`${weather.low}°–${weather.high}°`} />
              )}
              {weather.humidity != null && (
                <WeatherStat label="Humid" value={`${weather.humidity}%`} title="Relative humidity" />
              )}
              {weather.wind != null && (
                <WeatherStat
                  label="Wind"
                  value={`${weather.wind} ${windLabel(weather.windUnit)}`}
                  title="Wind speed"
                />
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-3 sm:px-4 py-2 rounded-xl app-surface dark:bg-[#111827] dark:border-[#1e3050] mb-3 sm:mb-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-300 truncate">{greeting}</p>
        <p className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-100 tabular-nums leading-tight">
          {formatClock(now)}
          <span className="ml-2 text-xs sm:text-sm font-normal text-slate-400 dark:text-slate-300 hidden sm:inline">
            {formatDate(now)}
          </span>
        </p>
      </div>
      {weather && (
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 text-right min-w-0 max-w-[55%]">
          <span className="text-lg sm:text-xl shrink-0" title={weather.description}>
            {weather.icon}
          </span>
          <div className="flex flex-col items-end min-w-0">
            <div className="flex items-center gap-1 text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100 tabular-nums min-w-0">
              <span className="shrink-0">
                {weather.temp}°{unitSuffix}
              </span>
              {weather.city && (
                <span className="text-xs sm:text-sm font-normal text-slate-500 dark:text-slate-300 truncate min-w-0">
                  {weather.city}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-0.5 text-xs tabular-nums text-slate-500 dark:text-slate-400">
              {weather.low != null && weather.high != null && (
                <span>
                  L {weather.low}° · H {weather.high}°
                </span>
              )}
              {weather.humidity != null && <span>{weather.humidity}% humid</span>}
              {weather.wind != null && (
                <span>
                  {weather.wind} {windLabel(weather.windUnit)}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
