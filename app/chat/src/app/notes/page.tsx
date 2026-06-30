"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { NoteCard } from "@/components/notes/note-card";
import { DeleteModal } from "@/components/notes/delete-modal";
import { AREAS } from "@/lib/constants";
import { api, type NoteListItem } from "@/lib/api-client";
import { useToast } from "@/components/toast";

function GhostCard({ index }: { index: number }) {
  const titles = ["Your first note goes here", "Add meeting notes", "Research findings", "Ideas & brainstorming"];
  const areas = ["ai-learning", "hiring", "quantum-physics", "others"];
  return (
    <div
      className="border-2 border-dashed border-gray-200 dark:border-gray-700"
      style={{
        borderRadius: 16,
        padding: 24,
        opacity: 0.4,
      }}
    >
      <p style={{ fontSize: 15, fontWeight: 500, marginBottom: 12 }} className="text-gray-400 dark:text-gray-500">
        {titles[index % titles.length]}
      </p>
      <span style={{ fontSize: 12, fontWeight: 500, padding: "4px 12px", borderRadius: 8 }} className="bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500">
        {areas[index % areas.length]}
      </span>
    </div>
  );
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
  const [areaFilter, setAreaFilter] = useState("");
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{
    slug: string;
    title: string;
  } | null>(null);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.listNotes(areaFilter || undefined);
      setNotes(data);
    } catch {
      setNotes([]);
    }
    setLoading(false);
  }, [areaFilter]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

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

  return (
    <div className="flex-1 max-w-3xl mx-auto w-full px-6">
      {/* Spacer */}
      <div className="h-16" />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 32 }}>
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
          style={{
            height: 44,
            padding: "0 20px",
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 600,
            background: "#2563eb",
            color: "white",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            whiteSpace: "nowrap",
            flexShrink: 0,
            marginTop: 4,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New note
        </Link>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ position: "relative" }}>
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes by title..."
            className="form-input"
            style={{ paddingLeft: 44, height: 48 }}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="note-page-filters" style={{ marginBottom: 32 }}>
        {["", ...AREAS].map((a) => (
          <button
            key={a}
            onClick={() => setAreaFilter(a)}
            style={{ height: 44, padding: "0 24px", borderRadius: 12 }}
            className={`text-sm font-medium border-2 transition-all ${
              areaFilter === a
                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50"
            }`}
          >
            {a || "All"}
          </button>
        ))}
      </div>

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
              <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
                <div className="note-form-row" style={{ gap: 20 }}>
                  {Array.from({ length: 4 }, (_, i) => (
                    <GhostCard key={i} index={i} />
                  ))}
                </div>
                <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                  <p style={{ fontSize: 16, fontWeight: 500, color: "#6b7280" }}>Your knowledge base is empty</p>
                  <p style={{ fontSize: 14, color: "#9ca3af" }}>Start by creating your first note.</p>
                  <Link
                    href="/notes/new"
                    style={{ height: 44, padding: "0 28px", borderRadius: 12, fontSize: 14, fontWeight: 600, background: "#2563eb", color: "white", display: "inline-flex", alignItems: "center", justifyContent: "center", marginTop: 4 }}
                  >
                    Create a note
                  </Link>
                </div>
              </div>
            );
          }

          const q = searchQuery.toLowerCase();
          const filtered = q
            ? notes.filter((n) =>
                n.title.toLowerCase().includes(q) ||
                n.area.toLowerCase().includes(q) ||
                n.slug.toLowerCase().includes(q)
              )
            : notes;

          if (filtered.length === 0) {
            return (
              <p style={{ textAlign: "center", fontSize: 14, color: "#9ca3af", padding: "40px 0" }}>
                No notes matching &ldquo;{searchQuery}&rdquo;
              </p>
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
