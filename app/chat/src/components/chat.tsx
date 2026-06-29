"use client";

import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import { MessageList } from "./message-list";
import { ChatInput } from "./chat-input";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const transport = new TextStreamChatTransport({
  api: `${API_URL}/chat`,
});

export function Chat() {
  const { messages, sendMessage, status, error } = useChat({ transport });

  const isLoading = status === "streaming" || status === "submitted";

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto w-full">
      <MessageList messages={messages} isLoading={isLoading} />

      {error && (
        <div className="mx-4 mb-2 rounded-lg bg-red-50 dark:bg-red-900/20 px-4 py-2 text-sm text-red-600 dark:text-red-400">
          Something went wrong. Please try again.
        </div>
      )}

      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <ChatInput sendMessage={sendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
}
