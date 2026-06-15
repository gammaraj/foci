import { ImageResponse } from "next/og";
import { OgLogoMark } from "@/lib/og-logo-mark";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

/** Trim long post titles for OG card layout. */
export function truncateOgTitle(title: string, max = 100): string {
  if (title.length <= max) return title;
  return `${title.slice(0, max - 1).trim()}…`;
}

interface BlogOgImageProps {
  title: string;
  description: string;
  tag?: string;
  date?: string;
}

export function renderBlogOgImage({ title, description, tag, date }: BlogOgImageProps) {
  const headline = truncateOgTitle(title);
  const blurb = description.length > 140 ? `${description.slice(0, 137).trim()}…` : description;

  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0c0c18 0%, #141432 45%, #1a1a36 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px 64px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <OgLogoMark size={48} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: "white", letterSpacing: -0.5 }}>
              Foci Blog
            </span>
            {tag ? (
              <span style={{ fontSize: 16, color: "rgba(147, 197, 253, 0.95)", marginTop: 4 }}>
                {tag}
              </span>
            ) : null}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 980 }}>
          <div
            style={{
              fontSize: headline.length > 70 ? 44 : 52,
              fontWeight: 700,
              color: "white",
              lineHeight: 1.15,
              letterSpacing: -1.5,
            }}
          >
            {headline}
          </div>
          <div
            style={{
              fontSize: 24,
              color: "rgba(255, 255, 255, 0.55)",
              lineHeight: 1.4,
              maxWidth: 900,
            }}
          >
            {blurb}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "rgba(255, 255, 255, 0.35)",
            fontSize: 18,
          }}
        >
          <span>usefoci.com</span>
          {date ? <span>{date}</span> : null}
        </div>
      </div>
    ),
    { ...OG_SIZE },
  );
}
