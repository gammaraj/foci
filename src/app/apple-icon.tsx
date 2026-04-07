import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #d97706 0%, #c2410c 100%)",
          borderRadius: 40,
        }}
      >
        {/* Outer ring */}
        <div
          style={{
            position: "absolute",
            width: 120,
            height: 120,
            borderRadius: "50%",
            border: "5px solid rgba(255, 255, 255, 0.85)",
          }}
        />
        {/* Inner ring */}
        <div
          style={{
            position: "absolute",
            width: 70,
            height: 70,
            borderRadius: "50%",
            border: "3px solid rgba(255, 255, 255, 0.3)",
          }}
        />
        {/* Blade 1 - upper left */}
        <div
          style={{
            position: "absolute",
            width: 5.5,
            height: 26,
            borderRadius: 3,
            background: "rgba(255, 255, 255, 0.8)",
            top: 40,
            left: 87,
            transform: "rotate(30deg)",
          }}
        />
        {/* Blade 2 - lower right */}
        <div
          style={{
            position: "absolute",
            width: 5.5,
            height: 26,
            borderRadius: 3,
            background: "rgba(255, 255, 255, 0.8)",
            top: 96,
            left: 119,
            transform: "rotate(150deg)",
          }}
        />
        {/* Blade 3 - lower left */}
        <div
          style={{
            position: "absolute",
            width: 5.5,
            height: 26,
            borderRadius: 3,
            background: "rgba(255, 255, 255, 0.8)",
            top: 96,
            left: 55,
            transform: "rotate(270deg)",
          }}
        />
        {/* Focal point */}
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "white",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
