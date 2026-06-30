"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MessageBubble } from "./message-bubble";
import type { UIMessage } from "ai";

const SUGGESTIONS = [
  { title: "What notes do I have?", desc: "Browse your knowledge base" },
  { title: "Summarize my knowledge base", desc: "Get a high-level overview" },
  { title: "What topics have I explored?", desc: "Discover your areas" },
  { title: "Find connections between notes", desc: "Link ideas together" },
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

interface MessageListProps {
  messages: UIMessage[];
  isLoading: boolean;
  onSendMessage?: (message: { text: string }) => void;
}

export function MessageList({
  messages,
  isLoading,
  onSendMessage,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    function handleScroll() {
      if (!el) return;
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      setShowScrollBtn(distanceFromBottom > 100);
    }

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-6" style={{ paddingTop: 32 }}>
        <div className="w-full max-w-lg" style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {/* Greeting */}
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-blue-600 dark:text-blue-400"
              >
                <path d="M12 2a7 7 0 0 1 7 7c0 2.5-1.3 4.8-3.5 6-.3.2-.5.5-.5.9V17a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-1.1c0-.4-.2-.7-.5-.9C6.3 13.8 5 11.5 5 9a7 7 0 0 1 7-7z" />
                <path d="M9 21h6" />
                <path d="M10 21a2 2 0 0 0 4 0" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {getGreeting()}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Ask anything about your knowledge base.
            </p>
          </div>

          {/* Suggestion cards — 2x2 grid like ChatGPT */}
          {onSendMessage && (
            <div className="note-form-row" style={{ gap: 12 }}>
              {SUGGESTIONS.map(({ title, desc }) => (
                <button
                  key={title}
                  data-testid="suggestion-chip"
                  onClick={() => onSendMessage({ text: title })}
                  className="text-left p-4 rounded-xl border border-gray-200 dark:border-gray-700
                    hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50
                    transition-colors group"
                >
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100">
                    {title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {desc}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-6 chat-scroll relative">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      {isLoading && (() => {
        const last = messages[messages.length - 1];
        const hasText = last?.role === "assistant" && last.parts
          .some((p) => p.type === "text" && (p as { type: "text"; text: string }).text.length > 0);
        return !hasText;
      })() && (
          <div className="flex items-center gap-3 animate-fade-in-up">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a7 7 0 0 1 7 7c0 2.5-1.3 4.8-3.5 6-.3.2-.5.5-.5.9V17a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-1.1c0-.4-.2-.7-.5-.9C6.3 13.8 5 11.5 5 9a7 7 0 0 1 7-7z" />
                <path d="M9 21h6" />
                <path d="M10 21a2 2 0 0 0 4 0" />
              </svg>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 dark:bg-blue-500 thinking-dot" />
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 dark:bg-blue-500 thinking-dot" style={{ animationDelay: "0.2s" }} />
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 dark:bg-blue-500 thinking-dot" style={{ animationDelay: "0.4s" }} />
            </div>
          </div>
        )}
      <div ref={bottomRef} />

      {showScrollBtn && (
        <button
          onClick={scrollToBottom}
          aria-label="Scroll to bottom"
          className="sticky bottom-4 left-1/2 -translate-x-1/2 z-10
            w-9 h-9 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
            shadow-lg flex items-center justify-center
            hover:bg-gray-50 dark:hover:bg-gray-700 transition-all animate-fade-in-up"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 dark:text-gray-300">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      )}
    </div>
  );
}
