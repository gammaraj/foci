/** Logo mark for next/og ImageResponse (Satori — solid arcs, no dashed strokes). */
import {
  FOCI_LOGO_BG,
  FOCI_LOGO_DOT,
  FOCI_RING_COLORS,
  FOCI_WORDMARK_GRADIENT_CSS,
} from "@/lib/logo-brand";

export function OgLogoMark({ size = 96 }: { size?: number }) {
  const tileRadius = size * 0.25;
  const ringRadius = size * (10 / 32);
  const ringDiameter = ringRadius * 2;
  const ringOffset = (size - ringDiameter) / 2;
  const ringStroke = size * (3.2 / 32);
  const innerDiameter = size * (13 / 32);
  const innerOffset = (size - innerDiameter) / 2;
  const dotDiameter = size * (5.5 / 32);
  const dotOffset = (size - dotDiameter) / 2;
  const { dim, mid, bright } = FOCI_RING_COLORS;

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
          borderRadius: tileRadius,
          background: FOCI_LOGO_BG,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: ringOffset,
          left: ringOffset,
          width: ringDiameter,
          height: ringDiameter,
          borderRadius: "50%",
          border: `${ringStroke}px solid rgba(59, 130, 246, 0.22)`,
          boxSizing: "border-box",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: ringOffset,
          left: ringOffset,
          width: ringDiameter,
          height: ringDiameter,
          borderRadius: "50%",
          border: `${ringStroke}px solid transparent`,
          borderTopColor: bright,
          borderRightColor: bright,
          borderBottomColor: dim,
          borderLeftColor: mid,
          transform: "rotate(-68deg)",
          boxSizing: "border-box",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: innerOffset,
          left: innerOffset,
          width: innerDiameter,
          height: innerDiameter,
          borderRadius: "50%",
          border: `${Math.max(1, size * 0.03)}px solid rgba(96, 165, 250, 0.32)`,
          boxSizing: "border-box",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: dotOffset,
          left: dotOffset,
          width: dotDiameter,
          height: dotDiameter,
          borderRadius: "50%",
          background: FOCI_LOGO_DOT,
        }}
      />
    </div>
  );
}

export { FOCI_WORDMARK_GRADIENT_CSS as FOCI_LOGO_GRADIENT };
