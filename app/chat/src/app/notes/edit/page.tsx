"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { NoteForm, type NoteFormData } from "@/components/notes/note-form";
import { api } from "@/lib/api-client";
import { useToast } from "@/components/toast";

function EditNoteContent() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug");
  const router = useRouter();
  const { toast } = useToast();

  const [initialData, setInitialData] = useState<NoteFormData | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) {
      setNotFound(true);
      return;
    }
    async function load() {
      try {
        const page = await api.getNote(slug!);
        setInitialData({
          title: page.title,
          area: page.area,
          tags: page.tags,
          content: page.content,
        });
      } catch {
        setNotFound(true);
      }
    }
    load();
  }, [slug]);

  async function handleSubmit(data: NoteFormData) {
    await api.updateNote(slug!, data);
    toast("Note updated");
    router.push("/notes");
  }

  if (notFound) {
    return (
      <div className="flex-1 max-w-3xl mx-auto w-full px-6">
        <div className="h-16" />
        <p className="text-sm text-gray-500">Note not found.</p>
      </div>
    );
  }

  if (!initialData) {
    return (
      <div className="flex-1 max-w-3xl mx-auto w-full px-6">
        <div className="h-16" />
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-3xl mx-auto w-full px-6" style={{ paddingBottom: 64 }}>
      {/* Spacer */}
      <div className="h-16" />

      <div style={{ marginBottom: 12 }}>
        <Link
          href="/notes"
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to notes
        </Link>
      </div>

      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.025em" }}>Edit Note</h1>
        <p className="text-base text-gray-500 dark:text-gray-400" style={{ marginTop: 8 }}>
          Update your knowledge base entry.
        </p>
      </div>

      <NoteForm
        initialData={initialData}
        onSubmit={handleSubmit}
        submitLabel="Update"
      />
    </div>
  );
}

export default function EditNotePage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 max-w-3xl mx-auto w-full px-6">
          <div className="h-16" />
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      }
    >
      <EditNoteContent />
    </Suspense>
  );
}
