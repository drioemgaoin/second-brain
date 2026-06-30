"use client";

import { useEffect, useRef } from "react";

interface DeleteModalProps {
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteModal({ title, onConfirm, onCancel }: DeleteModalProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();

    // Lock body scroll
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [onCancel]);

  return (
    <div
      className="delete-modal-overlay"
      onClick={onCancel}
    >
      <div
        className="delete-modal-panel"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onCancel}
          className="delete-modal-close"
          aria-label="Close"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Icon */}
        <div className="delete-modal-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </div>

        {/* Text */}
        <h3 className="delete-modal-title">Delete note</h3>
        <p className="delete-modal-desc">
          Are you sure you want to delete <strong>&ldquo;{title}&rdquo;</strong>?
        </p>
        <p className="delete-modal-hint">
          This note will be recoverable for 72 hours.
        </p>

        {/* Actions */}
        <div className="delete-modal-actions">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="delete-modal-btn delete-modal-btn-cancel"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="delete-modal-btn delete-modal-btn-confirm"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
