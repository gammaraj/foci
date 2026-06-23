import { ImageResponse } from "next/og";
import { OgLogoMark } from "@/lib/og-logo-mark";
import { FOCI_TAGLINE_CALM, FOCI_TAGLINE_FOCUS, FOCI_WORDMARK_GRADIENT_CSS, FOCI_WORDMARK_OG_PX } from "@/lib/logo-brand";

export const alt = "Foci – Free Pomodoro Timer, Tasks & Focus App";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function OgBrandImage() {
  return (
    <div
      style={{
        background: "linear-gradient(135deg, #0a0f1a 0%, #111827 100%)",
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
          gap: 28,
          marginBottom: 36,
        }}
      >
        <OgLogoMark size={96} />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div
            style={{
              fontSize: FOCI_WORDMARK_OG_PX,
              fontWeight: 700,
              letterSpacing: -2,
              background: FOCI_WORDMARK_GRADIENT_CSS,
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            foci
          </div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: 5,
              color: "rgba(251, 146, 60, 0.75)",
            }}
          >
            {FOCI_TAGLINE_FOCUS}
          </div>
        </div>
      </div>
      <div
        style={{
          fontSize: 34,
          fontWeight: 600,
          color: "rgba(255, 255, 255, 0.88)",
          letterSpacing: -0.5,
        }}
      >
        {FOCI_TAGLINE_CALM}
      </div>
      <div
        style={{
          display: "flex",
          gap: 28,
          marginTop: 48,
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
  );
}

export default function Image() {
  return new ImageResponse(<OgBrandImage />, { ...size });
}
