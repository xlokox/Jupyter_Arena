import { ImageResponse } from "next/og";
import { getChallenge } from "@/lib/content/source";

export const alt = "Challenge preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const DIFFICULTY_COLOR: Record<string, string> = {
  easy: "#34d399",
  medium: "#f59e0b",
  hard: "#f87171",
  very_hard: "#c084fc",
};

export default async function OgImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const challenge = await getChallenge(id);

  const title = challenge?.title ?? "Jupyter Arena";
  const sector = (challenge?.sector ?? "").toUpperCase();
  const difficulty = challenge?.difficulty ?? "";
  const difficultyLabel = difficulty.replace("_", " ");
  const difficultyColor = DIFFICULTY_COLOR[difficulty] ?? "#8b93a7";

  return new ImageResponse(
    (
      <div
        style={{
          background: "#0a0c10",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          padding: "60px",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: "#f59e0b",
          }}
        />

        {/* App name */}
        <div
          style={{
            fontSize: 28,
            color: "#8b93a7",
            marginBottom: "auto",
            paddingTop: 20,
          }}
        >
          Jupyter Arena
        </div>

        {/* Challenge title */}
        <div
          style={{
            fontSize: 54,
            fontWeight: 700,
            color: "#e6e9ef",
            lineHeight: 1.2,
            marginBottom: 32,
            maxWidth: 900,
          }}
        >
          {title}
        </div>

        {/* Sector + difficulty badges */}
        <div style={{ display: "flex", gap: 16 }}>
          {sector && (
            <div
              style={{
                background: "#11141a",
                border: "1px solid #232936",
                borderRadius: 8,
                padding: "8px 20px",
                color: "#8b93a7",
                fontSize: 24,
              }}
            >
              {sector}
            </div>
          )}
          {difficultyLabel && (
            <div
              style={{
                background: "#11141a",
                border: `1px solid ${difficultyColor}`,
                borderRadius: 8,
                padding: "8px 20px",
                color: difficultyColor,
                fontSize: 24,
              }}
            >
              {difficultyLabel}
            </div>
          )}
        </div>
      </div>
    ),
    { ...size },
  );
}
