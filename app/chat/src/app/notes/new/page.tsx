"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { NoteForm, type NoteFormData } from "@/components/notes/note-form";
import { api } from "@/lib/api-client";
import { useToast } from "@/components/toast";

export default function NewNotePage() {
  const router = useRouter();
  const { toast } = useToast();

  async function handleSubmit(data: NoteFormData) {
    await api.createNote(data);
    toast("Note created");
    router.push("/notes");
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
        <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.025em" }}>New Note</h1>
        <p className="text-base text-gray-500 dark:text-gray-400" style={{ marginTop: 8 }}>
          Create a new entry in your knowledge base.
        </p>
      </div>

      <NoteForm onSubmit={handleSubmit} submitLabel="Publish" />
    </div>
  );
}
