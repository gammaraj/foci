import { ImageResponse } from "next/og";

export const alt = "Foci – Your Focus System: Timer, Tasks, Goals & Ambient Music";
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
            width: 96,
            height: 96,
            marginBottom: 40,
            position: "relative",
          }}
        >
          {/* Icon background */}
          <div style={{ position: "absolute", width: 96, height: 96, borderRadius: 24, background: "linear-gradient(135deg, #d97706 0%, #c2410c 100%)" }} />
          {/* Outer ring */}
          <div style={{ position: "absolute", width: 64, height: 64, borderRadius: "50%", border: "3px solid rgba(255,255,255,0.85)" }} />
          {/* Inner ring */}
          <div style={{ position: "absolute", width: 38, height: 38, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)" }} />
          {/* Blade 1 */}
          <div style={{ position: "absolute", width: 3, height: 14, borderRadius: 2, background: "rgba(255,255,255,0.8)", top: 21, left: 46.5, transform: "rotate(30deg)" }} />
          {/* Blade 2 */}
          <div style={{ position: "absolute", width: 3, height: 14, borderRadius: 2, background: "rgba(255,255,255,0.8)", top: 51, left: 63.5, transform: "rotate(150deg)" }} />
          {/* Blade 3 */}
          <div style={{ position: "absolute", width: 3, height: 14, borderRadius: 2, background: "rgba(255,255,255,0.8)", top: 51, left: 29.5, transform: "rotate(270deg)" }} />
          {/* Focal point */}
          <div style={{ width: 15, height: 15, borderRadius: "50%", background: "white" }} />
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
