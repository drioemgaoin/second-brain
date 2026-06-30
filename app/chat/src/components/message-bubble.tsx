"use client";

import { useState } from "react";
import Markdown from "react-markdown";
import type { UIMessage } from "ai";

interface MessageBubbleProps {
  message: UIMessage;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      aria-label={copied ? "Copied" : "Copy message"}
      className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity
        w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-200 dark:hover:bg-gray-700
        text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
    >
      {copied ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  );
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  const textContent = message.parts
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join("");

  if (!textContent) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const timestamp = new Date((message as any).createdAt ?? Date.now());

  if (isUser) {
    return (
      <div className="flex justify-end animate-fade-in-up">
        <div className="max-w-[75%] rounded-2xl rounded-br-md bg-blue-600 text-white px-4 py-3 text-sm leading-relaxed">
          <p className="whitespace-pre-wrap">{textContent}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex items-start gap-3 animate-fade-in-up">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a7 7 0 0 1 7 7c0 2.5-1.3 4.8-3.5 6-.3.2-.5.5-.5.9V17a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-1.1c0-.4-.2-.7-.5-.9C6.3 13.8 5 11.5 5 9a7 7 0 0 1 7-7z" />
          <path d="M9 21h6" />
          <path d="M10 21a2 2 0 0 0 4 0" />
        </svg>
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="prose prose-sm dark:prose-invert max-w-none
          prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-headings:my-3
          prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-[13px] prose-code:font-normal
          prose-pre:bg-gray-900 prose-pre:rounded-xl prose-pre:border prose-pre:border-gray-800
          text-sm leading-relaxed">
          <Markdown>{textContent}</Markdown>
        </div>

        {/* Actions row */}
        <div className="flex items-center gap-1">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] text-gray-400 dark:text-gray-500 tabular-nums">
            {timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
          <CopyButton text={textContent} />
        </div>
      </div>
    </div>
  );
}
