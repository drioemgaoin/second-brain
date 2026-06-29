import type { GBrainChunk } from "./gbrain";

export function buildSystemPrompt(chunks: GBrainChunk[]): string {
  if (chunks.length === 0) {
    return `You are a helpful knowledge assistant. The knowledge base returned no results for this query. Let the user know you couldn't find relevant notes, and suggest they try rephrasing or ask about a different topic.`;
  }

  const sources = chunks
    .map(
      (chunk, i) =>
        `[${i + 1}] ${chunk.slug} (relevance: ${chunk.score.toFixed(2)})\n${chunk.content}`
    )
    .join("\n\n---\n\n");

  return `You are a helpful knowledge assistant that answers questions based on the user's personal knowledge base.

INSTRUCTIONS:
- Answer the question using ONLY the retrieved notes below.
- Cite your sources by referencing the note number, e.g. [1], [2].
- If the notes don't contain enough information to answer, say so honestly.
- Keep answers clear and concise.
- Use markdown formatting for readability.

RETRIEVED NOTES:
${sources}`;
}
