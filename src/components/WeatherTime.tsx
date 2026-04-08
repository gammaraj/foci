"use client";

import { useState, useEffect } from "react";

interface WeatherData {
  temp: number;
  description: string;
  icon: string;
  city: string;
}

const WEATHER_ICONS: Record<string, string> = {
  "01d": "☀️", "01n": "🌙",
  "02d": "⛅", "02n": "☁️",
  "03d": "☁️", "03n": "☁️",
  "04d": "☁️", "04n": "☁️",
  "09d": "🌧️", "09n": "🌧️",
  "10d": "🌦️", "10n": "🌧️",
  "11d": "⛈️", "11n": "⛈️",
  "13d": "🌨️", "13n": "🌨️",
  "50d": "🌫️", "50n": "🌫️",
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
  const [loading, setLoading] = useState(true);

  // Update clock every minute
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Fetch weather on mount (uses browser geolocation + Open-Meteo free API — no key needed)
  useEffect(() => {
    let cancelled = false;

    async function fetchWeather() {
      try {
        // Try geolocation
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        const { latitude, longitude } = pos.coords;

        // Get weather from Open-Meteo (free, no API key)
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&temperature_unit=fahrenheit&timezone=auto`
        );
        if (!res.ok) throw new Error("Weather API error");
        const data = await res.json();

        // Get city name via reverse geocoding (Open-Meteo geocoding)
        let city = "";
        try {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=10`
          );
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            city = geoData.address?.city || geoData.address?.town || geoData.address?.county || "";
          }
        } catch {
          // City name is optional
        }

        if (cancelled) return;

        const weatherCode = data.current?.weather_code ?? 0;
        const temp = Math.round(data.current?.temperature_2m ?? 0);
        const { desc, icon } = weatherCodeToInfo(weatherCode);

        setWeather({ temp, description: desc, icon, city });
      } catch {
        // Geolocation denied or API failed — just show clock
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchWeather();
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
      {!loading && weather && (
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

/** Map WMO weather codes to description + emoji */
function weatherCodeToInfo(code: number): { desc: string; icon: string } {
  if (code === 0) return { desc: "Clear sky", icon: "☀️" };
  if (code <= 3) return { desc: "Partly cloudy", icon: "⛅" };
  if (code <= 48) return { desc: "Foggy", icon: "🌫️" };
  if (code <= 57) return { desc: "Drizzle", icon: "🌦️" };
  if (code <= 67) return { desc: "Rain", icon: "🌧️" };
  if (code <= 77) return { desc: "Snow", icon: "🌨️" };
  if (code <= 82) return { desc: "Rain showers", icon: "🌧️" };
  if (code <= 86) return { desc: "Snow showers", icon: "🌨️" };
  if (code <= 99) return { desc: "Thunderstorm", icon: "⛈️" };
  return { desc: "Unknown", icon: "🌡️" };
}
