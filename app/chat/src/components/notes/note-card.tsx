"use client";

import Link from "next/link";
import { useTheme } from "@/components/theme-provider";

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const AREA_COLORS: Record<string, { light: { bg: string; text: string }; dark: { bg: string; text: string } }> = {
  "ai-learning": { light: { bg: "#faf5ff", text: "#7e22ce" }, dark: { bg: "rgba(126,34,206,0.15)", text: "#d8b4fe" } },
  "quantum-physics": { light: { bg: "#f0fdfa", text: "#0f766e" }, dark: { bg: "rgba(15,118,110,0.15)", text: "#5eead4" } },
  "hiring": { light: { bg: "#fffbeb", text: "#b45309" }, dark: { bg: "rgba(180,83,9,0.15)", text: "#fcd34d" } },
  "others": { light: { bg: "#f3f4f6", text: "#4b5563" }, dark: { bg: "rgba(75,85,99,0.2)", text: "#d1d5db" } },
};

interface NoteCardProps {
  slug: string;
  title: string;
  area: string;
  updatedAt?: string;
  onDelete: (slug: string, title: string) => void;
}

export function NoteCard({ slug, title, area, updatedAt, onDelete }: NoteCardProps) {
  const { resolved } = useTheme();
  const dark = resolved === "dark";

  const areaColors = AREA_COLORS[area] || AREA_COLORS.others;
  const badge = dark ? areaColors.dark : areaColors.light;

  const cardBg = dark ? "#111827" : "#ffffff";
  const borderColor = dark ? "#1f2937" : "#e5e7eb";
  const borderHover = dark ? "#374151" : "#d1d5db";
  const mutedColor = dark ? "#6b7280" : "#9ca3af";

  return (
    <div
      data-testid="note-card"
      style={{
        position: "relative",
        borderRadius: 16,
        border: `1px solid ${borderColor}`,
        background: cardBg,
        display: "flex",
        flexDirection: "column",
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = borderHover;
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = borderColor;
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <Link
        href={`/notes/edit?slug=${encodeURIComponent(slug)}`}
        style={{ display: "flex", flexDirection: "column", padding: "20px 24px", flex: 1 }}
      >
        <h3 style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.4, marginBottom: 12, paddingRight: 28 }}>
          {title || slug}
        </h3>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: "auto" }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: "4px 10px",
              borderRadius: 6,
              letterSpacing: "0.01em",
              background: badge.bg,
              color: badge.text,
            }}
          >
            {area || "uncategorized"}
          </span>
          {updatedAt && (
            <span style={{ fontSize: 12, color: mutedColor }}>
              {formatRelativeTime(updatedAt)}
            </span>
          )}
        </div>
      </Link>

      <button
        data-testid="delete-button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDelete(slug, title);
        }}
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 8,
          color: mutedColor,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          zIndex: 2,
          transition: "color 0.15s, background 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "#ef4444";
          e.currentTarget.style.background = "rgba(239,68,68,0.1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = mutedColor;
          e.currentTarget.style.background = "transparent";
        }}
        aria-label={`Delete ${title}`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      </button>
    </div>
  );
}
