"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";

interface ChatInputProps {
  sendMessage: (message: { text: string }) => void;
  isLoading: boolean;
}

export function ChatInput({ sendMessage, isLoading }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage({ text: input });
      setInput("");
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 items-end">
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Ask a question about the knowledge base..."
        rows={1}
        className="flex-1 resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100
          dark:placeholder-gray-400"
        disabled={isLoading}
      />
      <button
        type="submit"
        disabled={isLoading || !input.trim()}
        className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white
          hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed
          transition-colors shrink-0"
      >
        {isLoading ? "Thinking..." : "Send"}
      </button>
    </form>
  );
}
