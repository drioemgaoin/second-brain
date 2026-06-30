"use client";

import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import { MessageList } from "./message-list";
import { ChatInput } from "./chat-input";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const transport = new TextStreamChatTransport({
  api: `${API_URL}/chat`,
});

const FOLLOW_UPS = [
  "Tell me more about that",
  "Can you give an example?",
  "What are the key takeaways?",
];

export function Chat() {
  const { messages, sendMessage, status, error } = useChat({ transport });

  const isLoading = status === "streaming" || status === "submitted";
  const lastMessage = messages[messages.length - 1];
  const lastAssistantText =
    lastMessage?.role === "assistant"
      ? lastMessage.parts
          .filter(
            (p): p is { type: "text"; text: string } => p.type === "text"
          )
          .map((p) => p.text)
          .join("")
      : "";
  const emptyResponse =
    !isLoading && lastMessage?.role === "assistant" && !lastAssistantText;
  const showFollowUps =
    messages.length > 0 &&
    lastMessage?.role === "assistant" &&
    !isLoading &&
    !!lastAssistantText;

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto w-full">
      <MessageList
        messages={messages}
        isLoading={isLoading}
        onSendMessage={sendMessage}
      />

      {(error || emptyResponse) && (
        <div className="mx-6 mb-3 rounded-xl bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400 animate-fade-in-up">
          {error
            ? "Something went wrong. Please try again."
            : "No response received. Make sure the chat model is running (see make pull-chat-model)."}
        </div>
      )}

      <div className="border-t border-gray-200 dark:border-gray-800 px-6 py-4 space-y-3">
        {showFollowUps && (
          <div className="grid grid-cols-3 gap-2 animate-fade-in-up">
            {FOLLOW_UPS.map((text) => (
              <button
                key={text}
                onClick={() => sendMessage({ text })}
                className="h-9 px-3 text-xs rounded-lg border border-gray-200 dark:border-gray-700
                  text-gray-600 dark:text-gray-400 hover:border-blue-300 dark:hover:border-blue-600
                  hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-center truncate"
              >
                {text}
              </button>
            ))}
          </div>
        )}
        <ChatInput sendMessage={sendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
}
