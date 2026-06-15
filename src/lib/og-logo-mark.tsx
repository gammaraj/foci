/** Logo mark for next/og ImageResponse (solid rings — Satori has no dashed strokes). */
export function OgLogoMark({ size = 96 }: { size?: number }) {
  const radius = size * 0.25;
  const outer = size * 0.67;
  const inner = size * 0.4;
  const dot = size * 0.16;
  const offset = (size - outer) / 2;
  const innerOffset = (size - inner) / 2;
  const dotOffset = (size - dot) / 2;

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        flexShrink: 0,
        display: "flex",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: radius,
          background: "linear-gradient(135deg, #fde68a 0%, #fbbf24 28%, #f59e0b 62%, #ea580c 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: radius,
          background: "linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 55%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: offset,
          left: offset,
          width: outer,
          height: outer,
          borderRadius: "50%",
          border: `${Math.max(2, size * 0.028)}px solid #ffffff`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: innerOffset,
          left: innerOffset,
          width: inner,
          height: inner,
          borderRadius: "50%",
          border: `${Math.max(2, size * 0.022)}px solid rgba(255,255,255,0.9)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: dotOffset,
          left: dotOffset,
          width: dot,
          height: dot,
          borderRadius: "50%",
          background: "#ffffff",
        }}
      />
    </div>
  );
}

export const FOCI_LOGO_GRADIENT =
  "linear-gradient(135deg, #fde68a 0%, #fbbf24 28%, #f59e0b 62%, #ea580c 100%)";
