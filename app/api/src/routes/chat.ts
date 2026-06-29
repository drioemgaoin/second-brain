import { Hono } from "hono";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { queryBrain } from "../lib/gbrain.js";
import { buildSystemPrompt } from "../lib/prompts.js";

// Ollama exposes an OpenAI-compatible API
const ollama = createOpenAI({
  baseURL: process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1",
  apiKey: "ollama", // required by the SDK but unused by Ollama
});

const chat = new Hono();

chat.post("/", async (c) => {
  const { messages } = (await c.req.json()) as { messages: UIMessage[] };

  // Extract latest user query for retrieval
  const lastUserMessage = [...messages]
    .reverse()
    .find((m) => m.role === "user");

  const query = lastUserMessage
    ? lastUserMessage.parts
        .filter(
          (p): p is { type: "text"; text: string } => p.type === "text"
        )
        .map((p) => p.text)
        .join("")
    : "";

  const chunks = await queryBrain(query);

  const model = process.env.CHAT_MODEL || "llama3.2";

  const result = streamText({
    model: ollama(model),
    system: buildSystemPrompt(chunks),
    messages: await convertToModelMessages(messages),
  });

  return result.toTextStreamResponse();
});

export default chat;
