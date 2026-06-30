"use client";

import { useState } from "react";
import Link from "next/link";
import Markdown from "react-markdown";
import { AREAS } from "@/lib/constants";
import { parseNoteMarkdown } from "@/lib/parse-note";
import { useTheme } from "@/components/theme-provider";

export interface NoteFormData {
  title: string;
  area: string;
  tags: string[];
  content: string;
}

interface NoteFormProps {
  initialData?: NoteFormData;
  onSubmit: (data: NoteFormData) => Promise<void>;
  submitLabel: string;
}

// -- Validation --------------------------------------------------------------

interface FieldErrors {
  title?: string;
  area?: string;
  tags?: string;
  content?: string;
}

const MAX_TITLE = 200;
const MAX_TAG = 50;
const MAX_TAGS = 20;

function validateFields(
  title: string,
  area: string,
  tagsInput: string,
  content: string
): FieldErrors {
  const errors: FieldErrors = {};

  if (!title.trim()) {
    errors.title = "Title is required.";
  } else if (title.trim().length > MAX_TITLE) {
    errors.title = `Title must be ${MAX_TITLE} characters or less.`;
  }

  if (!area.trim()) {
    errors.area = "Area is required.";
  }

  const tags = tagsInput
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  if (tags.length > MAX_TAGS) {
    errors.tags = `Maximum ${MAX_TAGS} tags allowed.`;
  } else if (tags.some((t) => t.length > MAX_TAG)) {
    errors.tags = `Each tag must be ${MAX_TAG} characters or less.`;
  }

  if (!content.trim()) {
    errors.content = "Content is required.";
  }

  return errors;
}

// -- Component ---------------------------------------------------------------

export function NoteForm({
  initialData,
  onSubmit,
  submitLabel,
}: NoteFormProps) {
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [area, setArea] = useState(initialData?.area ?? AREAS[0]);
  const [customArea, setCustomArea] = useState("");
  const [useCustomArea, setUseCustomArea] = useState(
    initialData?.area
      ? !AREAS.includes(initialData.area as (typeof AREAS)[number])
      : false
  );
  const [tagsInput, setTagsInput] = useState(
    initialData?.tags?.join(", ") ?? ""
  );
  const [content, setContent] = useState(initialData?.content ?? "");
  const [tab, setTab] = useState<"write" | "preview">("write");
  const { resolved } = useTheme();
  const dark = resolved === "dark";
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState("");

  const [pasteStatus, setPasteStatus] = useState<"idle" | "success">("idle");
  const [pasteError, setPasteError] = useState("");

  const effectiveArea = useCustomArea ? customArea : area;

  // -- Paste from clipboard --------------------------------------------------

  async function handlePaste() {
    setPasteError("");

    let text: string;
    try {
      text = await navigator.clipboard.readText();
    } catch {
      setPasteError(
        "Could not access the clipboard. Please allow clipboard access in your browser settings, or paste the note manually into the fields below."
      );
      return;
    }

    const result = parseNoteMarkdown(text);
    if (!result.ok) {
      setPasteError(result.reason);
      return;
    }

    const { data } = result;
    setTitle(data.title);
    setContent(data.content);
    setTagsInput(data.tags.join(", "));

    if (data.area) {
      const isPreset = AREAS.includes(data.area as (typeof AREAS)[number]);
      setUseCustomArea(!isPreset);
      if (isPreset) {
        setArea(data.area);
      } else {
        setCustomArea(data.area);
      }
    }

    setFieldErrors({});
    setSubmitError("");
    setPasteStatus("success");
    setTimeout(() => setPasteStatus("idle"), 2000);
  }

  // -- Submit ----------------------------------------------------------------

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const errors = validateFields(title, effectiveArea, tagsInput, content);
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setSubmitError("");
      return;
    }

    setSubmitError("");
    setSubmitting(true);
    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
      if (!tags.includes(effectiveArea)) {
        tags.unshift(effectiveArea);
      }
      await onSubmit({ title: title.trim(), area: effectiveArea.trim(), tags, content: content.trim() });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to save note.");
    } finally {
      setSubmitting(false);
    }
  }

  // -- Clear field error on change -------------------------------------------

  function clearError(field: keyof FieldErrors) {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  // -- Render ----------------------------------------------------------------

  return (
    <form onSubmit={handleSubmit} className="note-form">
      {/* Paste from clipboard */}
      <div>
        <button
          type="button"
          onClick={handlePaste}
          className="paste-clipboard-btn"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
          </svg>
          {pasteStatus === "success" ? "Pasted!" : "Paste from clipboard"}
        </button>

        {pasteError && (
          <div className="paste-error">
            <div className="paste-error-header">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <strong>Could not parse the note</strong>
            </div>
            <p>{pasteError}</p>
            <p className="paste-error-hint">
              Go back to Claude and make sure the note was copied correctly, or
              ask Claude to re-generate it.
            </p>
            <button
              type="button"
              onClick={() => setPasteError("")}
              className="paste-error-dismiss"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Title */}
      <div className="note-form-field">
        <label htmlFor="note-title" className="text-sm font-semibold">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="note-title"
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            clearError("title");
          }}
          placeholder="e.g. RAG evaluation basics"
          maxLength={MAX_TITLE}
          aria-label="Title"
          className={`form-input ${fieldErrors.title ? "error" : ""}`}
        />
        <div className="flex justify-between">
          {fieldErrors.title && (
            <p className="text-sm text-red-500">{fieldErrors.title}</p>
          )}
          <p className="text-xs text-gray-400 ml-auto">
            {title.length}/{MAX_TITLE}
          </p>
        </div>
      </div>

      {/* Area + Tags side by side */}
      <div className="note-form-row">
        <div className="note-form-field">
          <label htmlFor="note-area" className="text-sm font-semibold">
            Area <span className="text-red-500">*</span>
          </label>
          {useCustomArea ? (
            <>
              <input
                id="note-area"
                type="text"
                value={customArea}
                onChange={(e) => {
                  setCustomArea(e.target.value);
                  clearError("area");
                }}
                placeholder="Custom area name"
                aria-label="Area"
                className={`form-input ${fieldErrors.area ? "error" : ""}`}
              />
              <button
                type="button"
                onClick={() => setUseCustomArea(false)}
                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                style={{ alignSelf: "flex-start" }}
              >
                Use preset instead
              </button>
            </>
          ) : (
            <>
              <select
                id="note-area"
                value={area}
                onChange={(e) => {
                  setArea(e.target.value);
                  clearError("area");
                }}
                aria-label="Area"
                className="form-input"
              >
                {AREAS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setUseCustomArea(true)}
                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                style={{ alignSelf: "flex-start" }}
              >
                Use custom area
              </button>
            </>
          )}
          {fieldErrors.area && (
            <p className="text-sm text-red-500">{fieldErrors.area}</p>
          )}
        </div>

        <div className="note-form-field">
          <label htmlFor="note-tags" className="text-sm font-semibold">
            Tags{" "}
            <span className="text-gray-500 font-normal">(comma-separated)</span>
          </label>
          <input
            id="note-tags"
            type="text"
            value={tagsInput}
            onChange={(e) => {
              setTagsInput(e.target.value);
              clearError("tags");
            }}
            placeholder="e.g. rag, evaluation, ragas"
            aria-label="Tags"
            className={`form-input ${fieldErrors.tags ? "error" : ""}`}
          />
          {fieldErrors.tags ? (
            <p className="text-sm text-red-500">{fieldErrors.tags}</p>
          ) : (
            <p className="text-xs text-gray-400">
              Area is added as a tag automatically.
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="note-form-field-content">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <label htmlFor="note-content" className="text-sm font-semibold">
            Content <span className="text-red-500">*</span>
          </label>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              borderRadius: 12,
              border: `2px solid ${dark ? "#374151" : "#e5e7eb"}`,
              overflow: "hidden",
              width: 200,
            }}
          >
            <button
              type="button"
              onClick={() => setTab("write")}
              style={{
                height: 40,
                background: tab === "write" ? "#2563eb" : "transparent",
                color: tab === "write" ? "white" : "#6b7280",
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              Write
            </button>
            <button
              type="button"
              onClick={() => setTab("preview")}
              style={{
                height: 40,
                borderLeft: `2px solid ${dark ? "#374151" : "#e5e7eb"}`,
                background: tab === "preview" ? "#2563eb" : "transparent",
                color: tab === "preview" ? "white" : "#6b7280",
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              Preview
            </button>
          </div>
        </div>

        {tab === "write" ? (
          <div>
            <textarea
              id="note-content"
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                clearError("content");
              }}
              placeholder="Write your note in markdown..."
              rows={18}
              aria-label="Content"
              className={`form-textarea ${fieldErrors.content ? "error" : ""}`}
            />
            <div className="flex justify-between" style={{ marginTop: 8 }}>
              {fieldErrors.content && (
                <p className="text-sm text-red-500">{fieldErrors.content}</p>
              )}
              <p className="text-xs text-gray-400 ml-auto">
                {content.length} characters
              </p>
            </div>
          </div>
        ) : (
          <div
            style={{
              borderRadius: 12,
              border: `2px solid ${dark ? "#374151" : "#e5e7eb"}`,
              padding: "20px 24px",
              minHeight: "24rem",
              background: dark ? "#111827" : "white",
              color: dark ? "#f3f4f6" : "#1f2937",
            }}
          >
            {content ? (
              <div className="prose prose-base dark:prose-invert max-w-none">
                <Markdown>{content}</Markdown>
              </div>
            ) : (
              <p style={{ fontSize: 16, color: "#9ca3af" }}>
                Nothing to preview.
              </p>
            )}
          </div>
        )}
      </div>

      {submitError && (
        <div
          style={{
            borderRadius: 12,
            background: "#fef2f2",
            padding: "16px 20px",
            fontSize: 14,
            fontWeight: 500,
            color: "#dc2626",
          }}
        >
          {submitError}
        </div>
      )}

      {/* Action buttons */}
      <div className="note-form-actions">
        <Link href="/notes" className="form-btn form-btn-secondary">
          Cancel
        </Link>
        <button
          type="submit"
          disabled={submitting}
          className="form-btn form-btn-primary"
        >
          {submitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
