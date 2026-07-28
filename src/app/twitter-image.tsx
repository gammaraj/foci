import { ImageResponse } from "next/og";
import { OgLogoMark } from "@/lib/og-logo-mark";
import {
  FOCI_HERO_HEADLINE,
  FOCI_TAGLINE_CALM,
  FOCI_TAGLINE_FOCUS,
  FOCI_TAGLINE_OG_PX,
  FOCI_WORDMARK_GRADIENT_CSS,
  FOCI_WORDMARK_OG_PX,
} from "@/lib/logo-brand";

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
        padding: "48px 56px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 28,
          marginBottom: 40,
        }}
      >
        <OgLogoMark size={96} />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div
            style={{
              fontSize: FOCI_WORDMARK_OG_PX,
              fontWeight: 800,
              letterSpacing: -2.5,
              background: FOCI_WORDMARK_GRADIENT_CSS,
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            foci
          </div>
          <div
            style={{
              fontSize: FOCI_TAGLINE_OG_PX,
              fontWeight: 600,
              letterSpacing: 3.2,
              color: "#93c5fd",
            }}
          >
            {FOCI_TAGLINE_FOCUS}
          </div>
        </div>
      </div>
      <div
        style={{
          fontSize: 36,
          fontWeight: 700,
          color: "rgba(255, 255, 255, 0.95)",
          letterSpacing: -0.8,
          textAlign: "center",
          maxWidth: 980,
          lineHeight: 1.2,
        }}
      >
        {FOCI_HERO_HEADLINE}
      </div>
      <div
        style={{
          marginTop: 14,
          fontSize: 22,
          fontWeight: 500,
          color: "rgba(148, 163, 184, 0.95)",
          letterSpacing: -0.2,
          textAlign: "center",
        }}
      >
        {FOCI_TAGLINE_CALM}
      </div>
      <div
        style={{
          display: "flex",
          gap: 22,
          marginTop: 44,
          color: "rgba(255, 255, 255, 0.4)",
          fontSize: 16,
          letterSpacing: 0.3,
          fontWeight: 500,
        }}
      >
        <span>Timer</span>
        <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
        <span>Tasks</span>
        <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
        <span>Smart Plan</span>
        <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
        <span>Ambient sound</span>
        <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
        <span>Free</span>
      </div>
    </div>
  );
}

export default function Image() {
  return new ImageResponse(<OgBrandImage />, { ...size });
}
