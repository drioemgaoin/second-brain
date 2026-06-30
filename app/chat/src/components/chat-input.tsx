"use client";

import { useState, useRef, useEffect, useCallback, type FormEvent } from "react";

interface ChatInputProps {
  sendMessage: (message: { text: string }) => void;
  isLoading: boolean;
}

function getMicSupported(): boolean {
  if (typeof window === "undefined") return false;
  return !!(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).SpeechRecognition ??
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).webkitSpeechRecognition
  );
}

export function ChatInput({ sendMessage, isLoading }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [focused, setFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [micSupported, setMicSupported] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    setMicSupported(getMicSupported());
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join("");
      setInput((prev) => {
        const base = prev.trimEnd();
        return base ? `${base} ${transcript}` : transcript;
      });
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      stopListening();
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

  const canSend = input.trim() && !isLoading;

  return (
    <div className="space-y-1.5">
      {/* Unified input container — send button inside like ChatGPT/Claude */}
      <form
        onSubmit={handleSubmit}
        className={`flex items-end gap-2 rounded-2xl border bg-white dark:bg-gray-900 px-4 py-3 transition-shadow ${
          focused
            ? "border-blue-500 shadow-[0_0_0_1px_rgb(59,130,246)] dark:shadow-[0_0_0_1px_rgb(96,165,250)]"
            : "border-gray-200 dark:border-gray-700"
        }`}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={onKeyDown}
          placeholder="Ask anything about your knowledge base..."
          rows={1}
          aria-label="Chat message"
          className="flex-1 resize-none bg-transparent text-sm leading-relaxed
            placeholder-gray-400 dark:placeholder-gray-500 dark:text-gray-100
            focus:outline-none"
          disabled={isLoading}
        />
        <div className="flex items-center gap-1.5 shrink-0 pb-0.5">
          {micSupported && (
            <button
              type="button"
              onClick={toggleListening}
              disabled={isLoading}
              aria-label={isListening ? "Stop recording" : "Start voice input"}
              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors
                disabled:opacity-40 disabled:cursor-not-allowed ${
                isListening
                  ? "bg-red-500 text-white hover:bg-red-600 animate-pulse"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M12 1a4 4 0 0 0-4 4v7a4 4 0 0 0 8 0V5a4 4 0 0 0-4-4Z" />
                <path d="M6 10a1 1 0 0 0-2 0 8 8 0 0 0 7 7.93V21H8a1 1 0 1 0 0 2h8a1 1 0 1 0 0-2h-3v-3.07A8 8 0 0 0 20 10a1 1 0 1 0-2 0 6 6 0 0 1-12 0Z" />
              </svg>
            </button>
          )}
          <button
            type="submit"
            disabled={!canSend}
            aria-label={isLoading ? "Thinking" : "Send message"}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
              canSend
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed"
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </form>
      {focused && !input && (
        <p className="text-xs text-gray-500 dark:text-gray-400 px-2 text-center">
          Enter to send, Shift+Enter for new line
        </p>
      )}
    </div>
  );
}
