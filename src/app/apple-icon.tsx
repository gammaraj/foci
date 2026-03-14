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
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          borderRadius: 40,
        }}
      >
        {/* Outer ring */}
        <div
          style={{
            position: "absolute",
            width: 140,
            height: 140,
            borderRadius: "50%",
            border: "6px solid rgba(255, 255, 255, 0.25)",
          }}
        />
        {/* Inner ring */}
        <div
          style={{
            position: "absolute",
            width: 90,
            height: 90,
            borderRadius: "50%",
            border: "4px solid rgba(255, 255, 255, 0.5)",
          }}
        />
        {/* Focal point */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "white",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
