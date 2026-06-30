---
name: second-brain
description: Manage personal knowledge base — search, create, edit, and delete notes using the second-brain MCP tools
when_to_use: >
  When the user wants to interact with their personal knowledge base.
  Trigger on any of these intents:

  SEARCH: "what did I write about", "what do I know about", "do I have anything on",
  "search my brain", "search my notes", "find my note on", "look up my notes",
  "summarize my knowledge on", "what have I captured about"

  BROWSE: "show me my notes", "list my notes", "list notes in", "what areas do I have",
  "how many notes do I have", "show me everything in my brain"

  READ: "open my note on", "show me my note about", "read my note"

  CREATE: "save this as a note", "create a note from", "capture this",
  "save what we discussed", "remember this", "log this", "write this down",
  "bookmark this", "add this to my brain", "add this to my knowledge base",
  "save to my brain"

  EDIT: "update my note", "edit my note", "add to my note", "change my note",
  "rename my note", "tag my note", "move my note to", "retag"

  DELETE: "delete my note", "remove my note", "archive my note"

  KNOWLEDGE QUESTIONS: any question about a concept, technique, technology,
  best practice, or "how does X work" / "what is X" / "explain X" / "best way to"
  — these MUST search the knowledge base first before answering.
  Examples: "what is RAG", "best chunking strategy", "how do embeddings work",
  "explain transformers", "what evaluation framework should I use"

  DO NOT trigger on: "release notes", "take note of", "note that", "note:",
  "write a function", "search the codebase", or any use of "note" as a
  discourse marker rather than a reference to the personal knowledge base.
allowed-tools: mcp__second-brain__search_notes mcp__second-brain__list_notes mcp__second-brain__get_note mcp__second-brain__create_note mcp__second-brain__update_note mcp__second-brain__delete_note
---

# Second Brain

Use ONLY the `second-brain` MCP tools for all note operations. Never write files directly. Never use any other method.

## Knowledge questions (HIGHEST PRIORITY)

When the user asks any concept, technique, or knowledge question (even without mentioning "notes" or "brain"):

1. Call `search_notes` with the topic as the query
2. **If relevant results found (score > 0.5)**: answer based on the retrieved notes. Mention that the answer comes from their knowledge base and which note(s) it came from.
3. **If no relevant results**: answer from general knowledge, clearly state "I didn't find anything in your knowledge base on this topic", and offer to save the answer as a new note.

This ensures the personal knowledge base is ALWAYS the first source of truth.

## Searching

When the user explicitly asks what they wrote about a topic, or wants to find notes:

1. Call `search_notes` with their query
2. Present results as a numbered list: title, area, relevance score, one-line preview
3. If they want details on a result, call `get_note`
4. If no results found, say so clearly and suggest alternative search terms

## Browsing

When the user wants to list or browse their notes:

1. Call `list_notes` — pass the `area` filter if they mentioned one
2. Present results grouped by area with title and slug
3. If they ask "what areas do I have", call `list_notes` without a filter and show the distinct areas from the results

## Reading a note

When the user wants to see a specific note:

1. If they gave a slug, call `get_note` directly
2. If they gave a vague title or topic, call `search_notes` first to find the right slug, then `get_note`

## Creating a note from a conversation

When the user asks to save, capture, remember, log, or create a note:

1. Identify the topic and choose the best area (`ai-learning`, `quantum-physics`, `hiring`, or `others` — or a custom area if they specify one)
2. Call `search_notes` to check for duplicates — if a similar note exists, suggest updating it instead
3. Structure the content:

```
## Summary
One paragraph capturing the core insight.

## Key takeaways
- Bullet points of the most important points

## Details
Organized content under descriptive headings.

## Action items
- Concrete next steps (omit if none)

## Open questions
- Unanswered questions (omit if none)
```

4. Show the user a preview of the title, area, tags, and content
5. Wait for explicit confirmation before calling `create_note`
6. Generate 3-5 descriptive tags (always include the area)
7. If the conversation covered multiple topics, suggest separate notes

## Editing a note

When the user wants to update, change, add to, rename, retag, or move a note:

1. Fetch with `get_note` (or `search_notes` if the reference is vague)
2. Show the current content
3. Ask what to change (unless the instruction is already clear)
4. Apply the changes:
   - **Adding content**: append or insert into the appropriate section
   - **Tagging**: add/remove tags in the tags array
   - **Renaming**: update the title field
   - **Moving to another area**: update the area field and adjust tags
5. Preserve everything not asked to change
6. Show what changed, confirm, then call `update_note`

## Deleting a note

When the user wants to delete, remove, or archive a note:

1. Fetch and show the note first
2. Ask for explicit confirmation
3. Call `delete_note` — inform the user it is recoverable for 72 hours
