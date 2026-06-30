"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { NoteCard } from "@/components/notes/note-card";
import { DeleteModal } from "@/components/notes/delete-modal";
import { api, type NoteListItem } from "@/lib/api-client";
import { useToast } from "@/components/toast";
import { useTheme } from "@/components/theme-provider";

type SortMode = "newest" | "oldest" | "a-z" | "z-a";

const AREA_COLORS: Record<string, { light: { bg: string; text: string; border: string }; dark: { bg: string; text: string; border: string } }> = {
  "ai-learning": {
    light: { bg: "#faf5ff", text: "#7e22ce", border: "#e9d5ff" },
    dark: { bg: "rgba(126,34,206,0.15)", text: "#d8b4fe", border: "rgba(126,34,206,0.3)" },
  },
  "quantum-physics": {
    light: { bg: "#f0fdfa", text: "#0f766e", border: "#99f6e4" },
    dark: { bg: "rgba(15,118,110,0.15)", text: "#5eead4", border: "rgba(15,118,110,0.3)" },
  },
  "hiring": {
    light: { bg: "#fffbeb", text: "#b45309", border: "#fde68a" },
    dark: { bg: "rgba(180,83,9,0.15)", text: "#fcd34d", border: "rgba(180,83,9,0.3)" },
  },
};

const DEFAULT_COLORS = {
  light: { bg: "#f3f4f6", text: "#4b5563", border: "#d1d5db" },
  dark: { bg: "rgba(75,85,99,0.2)", text: "#d1d5db", border: "rgba(75,85,99,0.4)" },
};

function getAreaColor(area: string, dark: boolean) {
  const colors = AREA_COLORS[area] || DEFAULT_COLORS;
  return dark ? colors.dark : colors.light;
}

function SkeletonCard() {
  return (
    <div
      data-testid="skeleton-card"
      style={{ borderRadius: 16, border: "2px solid #e5e7eb", padding: 24, display: "flex", flexDirection: "column", gap: 16 }}
      className="animate-pulse"
    >
      <div style={{ height: 20, background: "#f3f4f6", borderRadius: 8, width: "75%" }} />
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ height: 28, background: "#f3f4f6", borderRadius: 8, width: 96 }} />
        <div style={{ height: 28, background: "#f3f4f6", borderRadius: 8, width: 64 }} />
      </div>
    </div>
  );
}

export default function NotesPage() {
  const [notes, setNotes] = useState<NoteListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAreas, setSelectedAreas] = useState<Set<string>>(new Set());
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { toast } = useToast();
  const { resolved } = useTheme();
  const dark = resolved === "dark";
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{
    slug: string;
    title: string;
  } | null>(null);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.listNotes();
      setNotes(data);
    } catch {
      setNotes([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const areas = useMemo(
    () => [...new Set(notes.map((n) => n.area))].sort(),
    [notes]
  );

  const areaCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const n of notes) {
      counts[n.area] = (counts[n.area] || 0) + 1;
    }
    return counts;
  }, [notes]);

  const activeFilterCount = selectedAreas.size + (sortMode !== "newest" ? 1 : 0);

  function toggleArea(area: string) {
    setSelectedAreas((prev) => {
      const next = new Set(prev);
      if (next.has(area)) next.delete(area);
      else next.add(area);
      return next;
    });
  }

  function clearFilters() {
    setSelectedAreas(new Set());
    setSortMode("newest");
    setSearchQuery("");
  }

  const filtered = useMemo(() => {
    let result = [...notes];

    // Area filter
    if (selectedAreas.size > 0) {
      result = result.filter((n) => selectedAreas.has(n.area));
    }

    // Search
    const q = searchQuery.toLowerCase();
    if (q) {
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.area.toLowerCase().includes(q) ||
          n.slug.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (sortMode) {
        case "newest":
          return (b.updatedAt || "").localeCompare(a.updatedAt || "");
        case "oldest":
          return (a.updatedAt || "").localeCompare(b.updatedAt || "");
        case "a-z":
          return a.title.localeCompare(b.title);
        case "z-a":
          return b.title.localeCompare(a.title);
      }
    });

    return result;
  }, [notes, selectedAreas, searchQuery, sortMode]);

  async function handleDelete(slug: string) {
    try {
      await api.deleteNote(slug);
      setNotes((prev) => prev.filter((n) => n.slug !== slug));
      toast("Note deleted");
    } catch {
      toast("Failed to delete note", "error");
    }
    setDeleteTarget(null);
  }

  const cardBg = dark ? "#111827" : "#ffffff";
  const borderColor = dark ? "#1f2937" : "#e5e7eb";
  const mutedColor = dark ? "#6b7280" : "#9ca3af";
  const surfaceBg = dark ? "#0d1117" : "#f9fafb";

  return (
    <div className="flex-1 max-w-3xl mx-auto w-full px-6">
      {/* Spacer */}
      <div className="h-16" />

      {/* Header */}
      <div style={{ marginBottom: 32, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.025em" }}>Notes</h1>
          {!loading && notes.length > 0 && (
            <p className="text-base text-gray-500 dark:text-gray-400" style={{ marginTop: 8 }}>
              {notes.length} {notes.length === 1 ? "note" : "notes"} in your knowledge base
            </p>
          )}
        </div>
        <Link
          href="/notes/new"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
          style={{ padding: "10px 20px", borderRadius: 10, display: "inline-flex", alignItems: "center", gap: 8 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Note
        </Link>
      </div>

      {/* Search & Filter toolbar */}
      <div
        style={{
          marginBottom: 24,
          borderRadius: 16,
          border: `1px solid ${borderColor}`,
          background: cardBg,
          overflow: "hidden",
          transition: "box-shadow 0.2s",
        }}
      >
        {/* Search row */}
        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
          {/* Search icon + input */}
          <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center" }}>
            <svg
              width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ position: "absolute", left: 16, color: mutedColor, pointerEvents: "none" }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              style={{
                flex: 1,
                height: 52,
                paddingLeft: 48,
                paddingRight: 16,
                background: "transparent",
                border: "none",
                outline: "none",
                fontSize: 14,
                color: dark ? "#ededed" : "#171717",
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute",
                  right: 8,
                  width: 28,
                  height: 28,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 6,
                  border: "none",
                  background: "transparent",
                  color: mutedColor,
                  cursor: "pointer",
                }}
                aria-label="Clear search"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 28, background: borderColor, flexShrink: 0 }} />

          {/* Filter toggle */}
          <button
            onClick={() => setFiltersOpen((prev) => !prev)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "0 18px",
              height: 52,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: filtersOpen || activeFilterCount > 0
                ? (dark ? "#93c5fd" : "#2563eb")
                : (dark ? "#9ca3af" : "#6b7280"),
              fontSize: 13,
              fontWeight: 500,
              whiteSpace: "nowrap",
              transition: "color 0.15s",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="8" y1="12" x2="16" y2="12" />
              <line x1="11" y1="18" x2="13" y2="18" />
            </svg>
            Filters
            {activeFilterCount > 0 && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 20,
                  height: 20,
                  borderRadius: 9999,
                  background: "#2563eb",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {activeFilterCount}
              </span>
            )}
            <svg
              width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ transition: "transform 0.2s", transform: filtersOpen ? "rotate(180deg)" : "rotate(0)" }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>

        {/* Filter panel */}
        <div
          style={{
            maxHeight: filtersOpen ? 300 : 0,
            opacity: filtersOpen ? 1 : 0,
            overflow: "hidden",
            transition: "max-height 0.25s ease, opacity 0.2s ease",
          }}
        >
          <div
            style={{
              borderTop: `1px solid ${borderColor}`,
              padding: "16px 20px",
              background: surfaceBg,
            }}
          >
            {/* Areas */}
            {areas.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: mutedColor, marginBottom: 10 }}>
                  Areas
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {areas.map((area) => {
                    const selected = selectedAreas.has(area);
                    const colors = getAreaColor(area, dark);
                    return (
                      <button
                        key={area}
                        onClick={() => toggleArea(area)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "5px 12px",
                          borderRadius: 8,
                          border: `1.5px solid ${selected ? colors.border : (dark ? "#374151" : "#e5e7eb")}`,
                          background: selected ? colors.bg : "transparent",
                          color: selected ? colors.text : mutedColor,
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        {area}
                        <span style={{ fontSize: 11, opacity: 0.7 }}>
                          {areaCounts[area]}
                        </span>
                        {selected && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sort + Clear row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: mutedColor }}>
                  Sort by
                </span>
                <div style={{ display: "flex", gap: 4 }}>
                  {([
                    { value: "newest", label: "Newest" },
                    { value: "oldest", label: "Oldest" },
                    { value: "a-z", label: "A\u2013Z" },
                    { value: "z-a", label: "Z\u2013A" },
                  ] as { value: SortMode; label: string }[]).map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSortMode(opt.value)}
                      style={{
                        padding: "4px 10px",
                        borderRadius: 6,
                        border: "none",
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: "pointer",
                        background: sortMode === opt.value
                          ? (dark ? "rgba(37,99,235,0.2)" : "#eff6ff")
                          : "transparent",
                        color: sortMode === opt.value
                          ? (dark ? "#93c5fd" : "#2563eb")
                          : mutedColor,
                        transition: "all 0.15s",
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: dark ? "#f87171" : "#dc2626",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px 8px",
                    borderRadius: 6,
                    transition: "opacity 0.15s",
                  }}
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Active filters summary */}
      {!filtersOpen && selectedAreas.size > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: mutedColor, marginRight: 4 }}>Filtering:</span>
          {[...selectedAreas].map((area) => {
            const colors = getAreaColor(area, dark);
            return (
              <button
                key={area}
                onClick={() => toggleArea(area)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "3px 10px",
                  borderRadius: 6,
                  background: colors.bg,
                  color: colors.text,
                  border: `1px solid ${colors.border}`,
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                {area}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            );
          })}
        </div>
      )}

      {/* Results count when filtered */}
      {!loading && notes.length > 0 && (searchQuery || selectedAreas.size > 0) && (
        <p style={{ fontSize: 13, color: mutedColor, marginBottom: 16 }}>
          {filtered.length} {filtered.length === 1 ? "result" : "results"}
          {filtered.length !== notes.length && ` of ${notes.length}`}
        </p>
      )}

      {/* Content */}
      <div style={{ paddingBottom: 64 }}>
        {(() => {
          if (loading) {
            return (
              <div className="note-form-row" style={{ gap: 20 }}>
                {Array.from({ length: 4 }, (_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            );
          }

          if (notes.length === 0) {
            return (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 64, marginBottom: 24, lineHeight: 1 }}>
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 dark:text-gray-600">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <line x1="10" y1="9" x2="8" y2="9" />
                  </svg>
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }} className="text-gray-700 dark:text-gray-200">
                  No notes yet
                </h2>
                <p style={{ fontSize: 15, maxWidth: 360, lineHeight: 1.6 }} className="text-gray-400 dark:text-gray-500">
                  Chat with your Second Brain to capture ideas, meeting notes, and research. Notes you create will appear here.
                </p>
              </div>
            );
          }

          if (filtered.length === 0) {
            return (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 20px", textAlign: "center" }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: mutedColor, marginBottom: 16 }}>
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <p style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }} className="text-gray-600 dark:text-gray-300">
                  No matching notes
                </p>
                <p style={{ fontSize: 13, color: mutedColor }}>
                  Try adjusting your search or filters
                </p>
                <button
                  onClick={clearFilters}
                  style={{
                    marginTop: 16,
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: `1px solid ${borderColor}`,
                    background: "transparent",
                    color: dark ? "#93c5fd" : "#2563eb",
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Clear all filters
                </button>
              </div>
            );
          }

          return (
            <div className="note-form-row" style={{ gap: 20 }}>
              {filtered.map((note) => (
                <NoteCard
                  key={note.slug}
                  slug={note.slug}
                  title={note.title}
                  area={note.area}
                  updatedAt={note.updatedAt}
                  onDelete={(slug, title) => setDeleteTarget({ slug, title })}
                />
              ))}
            </div>
          );
        })()}
      </div>

      {deleteTarget && (
        <DeleteModal
          title={deleteTarget.title}
          onConfirm={() => handleDelete(deleteTarget.slug)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
