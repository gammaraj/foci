import { ImageResponse } from "next/og";
import { OgLogoMark } from "@/lib/og-logo-mark";

export const alt = "Foci – Free Pomodoro Timer, Tasks & Focus App";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0c0c18 0%, #1a1a36 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 40,
          }}
        >
          <OgLogoMark size={96} />
        </div>
        <div
          style={{
            fontSize: 76,
            fontWeight: 700,
            color: "white",
            letterSpacing: -3,
          }}
        >
          Foci
        </div>
        <div
          style={{
            fontSize: 26,
            color: "rgba(255, 255, 255, 0.5)",
            marginTop: 16,
            letterSpacing: -0.5,
          }}
        >
          Your focus system, not just a timer.
        </div>
        <div
          style={{
            display: "flex",
            gap: 28,
            marginTop: 52,
            color: "rgba(255, 255, 255, 0.35)",
            fontSize: 17,
            letterSpacing: 0.5,
          }}
        >
          <span>Timer</span>
          <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
          <span>Tasks</span>
          <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
          <span>Goals</span>
          <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
          <span>Ambient Music</span>
          <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
          <span>Free</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
