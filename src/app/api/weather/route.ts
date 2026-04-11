import { NextResponse } from "next/server";
import { headers } from "next/headers";

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 20;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    if (rateLimitMap.size > 10_000) {
      for (const [key, val] of rateLimitMap) {
        if (now > val.resetAt) rateLimitMap.delete(key);
      }
    }
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

interface GeoResult {
  latitude: number;
  longitude: number;
  city: string;
}

async function getLocationFromIP(ip: string): Promise<GeoResult> {
  const services = [
    {
      url: `https://ipwho.is/${ip}`,
      parse: (d: Record<string, unknown>) => ({
        latitude: d.latitude as number,
        longitude: d.longitude as number,
        city: (d.city as string) || "",
      }),
    },
    {
      url: `https://ipapi.co/${ip}/json/`,
      parse: (d: Record<string, unknown>) => ({
        latitude: d.latitude as number,
        longitude: d.longitude as number,
        city: (d.city as string) || "",
      }),
    },
    {
      url: `https://get.geojs.io/v1/ip/geo/${ip}.json`,
      parse: (d: Record<string, unknown>) => ({
        latitude: parseFloat(d.latitude as string),
        longitude: parseFloat(d.longitude as string),
        city: (d.city as string) || "",
      }),
    },
  ];

  for (const svc of services) {
    try {
      const res = await fetch(svc.url, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) continue;
      const data = await res.json();
      const loc = svc.parse(data);
      if (loc.latitude && loc.longitude) return loc;
    } catch {
      continue;
    }
  }
  throw new Error("All IP geolocation services failed");
}

function weatherCodeToInfo(code: number): { description: string; icon: string } {
  if (code === 0) return { description: "Clear sky", icon: "clear" };
  if (code <= 3) return { description: "Partly cloudy", icon: "cloudy" };
  if (code <= 48) return { description: "Foggy", icon: "fog" };
  if (code <= 57) return { description: "Drizzle", icon: "drizzle" };
  if (code <= 67) return { description: "Rain", icon: "rain" };
  if (code <= 77) return { description: "Snow", icon: "snow" };
  if (code <= 82) return { description: "Rain showers", icon: "rain" };
  if (code <= 86) return { description: "Snow showers", icon: "snow" };
  if (code <= 99) return { description: "Thunderstorm", icon: "storm" };
  return { description: "Unknown", icon: "unknown" };
}

export async function GET(request: Request) {
  try {
    const hdrs = await headers();
    const forwarded = hdrs.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "";

    if (isRateLimited(ip || "unknown")) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const unit = searchParams.get("unit") === "celsius" ? "celsius" : "fahrenheit"; 

    const { latitude, longitude, city } = await getLocationFromIP(ip);

    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&temperature_unit=${unit}&timezone=auto`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!weatherRes.ok) throw new Error("Weather API error");
    const weatherData = await weatherRes.json();

    const weatherCode = weatherData.current?.weather_code ?? 0;
    const temp = Math.round(weatherData.current?.temperature_2m ?? 0);
    const { description, icon } = weatherCodeToInfo(weatherCode);

    return NextResponse.json(
      { temp, description, icon, city, unit },
      { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=300" } }
    );
  } catch {
    return NextResponse.json({ error: "Failed to fetch weather" }, { status: 500 });
  }
}
