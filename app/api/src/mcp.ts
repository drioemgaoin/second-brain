// ---------------------------------------------------------------------------
// MCP server endpoint — exposes second-brain API as MCP tools for Claude Code
//
// Claude Code connects here (http://localhost:3001/mcp) instead of hitting
// GBrain directly. This keeps the API as the single entry point.
//
// The `instructions` field in the initialize response tells Claude how to
// behave — no CLAUDE.md needed on the user's side.
// ---------------------------------------------------------------------------

import { Hono } from "hono";
import {
  queryBrain,
  listPages,
  getPage,
  putPage,
  deletePage,
} from "./lib/gbrain.js";
import { slugify } from "./lib/slugify.js";

const mcp = new Hono();

// -- Server instructions (sent on initialize) --------------------------------

const INSTRUCTIONS = `You are connected to a personal knowledge base ("second brain").
Use these tools to search, read, create, edit, and delete notes.

IMPORTANT RULES:
- Always use these MCP tools for note operations. Never write note files directly.
- Before creating a note, search first to avoid duplicates.

WHEN THE USER ASKS TO CREATE A NOTE FROM A CONVERSATION:
1. Identify the main topic and choose the best area (ai-learning, quantum-physics, hiring, or others).
2. Call search_notes to check for duplicates. If a similar note exists, suggest updating it instead.
3. Analyze the conversation and structure the content using this template:

## Summary
One paragraph capturing the core insight.

## Key takeaways
- Bullet points of the most important points

## Details
Organized content under descriptive headings.

## Action items
- Concrete next steps (omit if none)

## Open questions
- Unanswered questions worth exploring (omit if none)

4. Show the user a preview of the proposed title, area, tags, and content.
5. Wait for confirmation before calling create_note.

Generate 3-5 descriptive tags (always include the area). If the conversation covered multiple distinct topics, suggest separate notes.

WHEN THE USER ASKS TO EDIT A NOTE:
1. Fetch it with get_note (or search_notes if the reference is vague).
2. Show the current content.
3. Ask what to change.
4. Apply changes while preserving everything not asked to change.
5. Show what changed, confirm, then call update_note.

WHEN THE USER ASKS TO DELETE A NOTE:
1. Fetch and show the note first.
2. Ask for explicit confirmation.
3. Call delete_note. Inform the user it is recoverable for 72 hours.`;

// -- Tool definitions --------------------------------------------------------

const TOOLS = [
  {
    name: "search_notes",
    description:
      "Search notes in the knowledge base using semantic and keyword search. " +
      "Returns the most relevant chunks with slug, title, content, and relevance score. " +
      "Use this before creating a note to check for duplicates, and whenever the user asks a question about their notes.",
    inputSchema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "The search query (natural language or keywords)",
        },
        limit: {
          type: "number",
          description: "Max results to return (default 8)",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "list_notes",
    description:
      "List all notes, optionally filtered by area. " +
      "Areas: ai-learning, quantum-physics, hiring, others. " +
      "Use this when the user wants to browse or see what notes they have.",
    inputSchema: {
      type: "object" as const,
      properties: {
        area: {
          type: "string",
          description:
            "Filter by area: ai-learning, quantum-physics, hiring, others",
        },
        limit: {
          type: "number",
          description: "Max results (default 200)",
        },
      },
    },
  },
  {
    name: "get_note",
    description:
      "Get the full content of a single note by its slug (e.g. ai-learning/rag-evaluation). " +
      "Use this to read a note before editing or when the user wants to see its content.",
    inputSchema: {
      type: "object" as const,
      properties: {
        slug: {
          type: "string",
          description: "The note slug, e.g. ai-learning/rag-evaluation",
        },
      },
      required: ["slug"],
    },
  },
  {
    name: "create_note",
    description:
      "Create a new note in the knowledge base. " +
      "Before calling this, always: (1) search for duplicates, (2) structure the content with Summary, Key Takeaways, and Details sections, (3) show the user a preview and get confirmation. " +
      "Generate 3-5 descriptive tags. Always include the area as a tag.",
    inputSchema: {
      type: "object" as const,
      properties: {
        title: { type: "string", description: "Note title" },
        area: {
          type: "string",
          description:
            "Area: ai-learning, quantum-physics, hiring, or others",
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Tags for the note (3-5 recommended)",
        },
        content: {
          type: "string",
          description: "Markdown content of the note (without frontmatter)",
        },
      },
      required: ["title", "area", "content"],
    },
  },
  {
    name: "update_note",
    description:
      "Update an existing note by slug. " +
      "Before calling this, always: (1) fetch the current note with get_note, (2) show the user what will change, (3) get confirmation. " +
      "Preserve content that was not asked to change.",
    inputSchema: {
      type: "object" as const,
      properties: {
        slug: { type: "string", description: "The note slug to update" },
        title: { type: "string", description: "New title" },
        area: { type: "string", description: "New area" },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "New tags",
        },
        content: { type: "string", description: "New markdown content" },
      },
      required: ["slug", "title", "area", "content"],
    },
  },
  {
    name: "delete_note",
    description:
      "Soft-delete a note by slug. Recoverable for 72 hours. " +
      "Before calling this, always fetch the note and ask the user for explicit confirmation.",
    inputSchema: {
      type: "object" as const,
      properties: {
        slug: { type: "string", description: "The note slug to delete" },
      },
      required: ["slug"],
    },
  },
];

// -- Tool handlers -----------------------------------------------------------

type ToolArgs = Record<string, unknown>;

async function handleTool(
  name: string,
  args: ToolArgs
): Promise<{ content: { type: string; text: string }[] }> {
  switch (name) {
    case "search_notes": {
      const results = await queryBrain(
        String(args.query),
        Number(args.limit) || 8
      );
      return textResult(JSON.stringify(results, null, 2));
    }

    case "list_notes": {
      const pages = await listPages({
        tag: args.area ? String(args.area) : undefined,
        limit: Number(args.limit) || 200,
      });
      return textResult(JSON.stringify(pages, null, 2));
    }

    case "get_note": {
      const page = await getPage(String(args.slug));
      if (!page) {
        return textResult(JSON.stringify({ error: "Not found" }));
      }
      return textResult(JSON.stringify(page, null, 2));
    }

    case "create_note": {
      const slug = `${args.area}/${slugify(String(args.title))}`;
      await putPage(
        slug,
        String(args.title),
        String(args.area),
        Array.isArray(args.tags) ? args.tags.map(String) : [],
        String(args.content)
      );
      return textResult(JSON.stringify({ created: true, slug }));
    }

    case "update_note": {
      await putPage(
        String(args.slug),
        String(args.title),
        String(args.area),
        Array.isArray(args.tags) ? args.tags.map(String) : [],
        String(args.content)
      );
      return textResult(JSON.stringify({ updated: true, slug: args.slug }));
    }

    case "delete_note": {
      await deletePage(String(args.slug));
      return textResult(JSON.stringify({ deleted: true, slug: args.slug }));
    }

    default:
      return textResult(JSON.stringify({ error: `Unknown tool: ${name}` }));
  }
}

function textResult(text: string) {
  return { content: [{ type: "text", text }] };
}

// -- JSON-RPC 2.0 handler ----------------------------------------------------

interface JsonRpcRequest {
  jsonrpc: string;
  id: number | string | null;
  method: string;
  params?: Record<string, unknown>;
}

mcp.post("/", async (c) => {
  const req = (await c.req.json()) as JsonRpcRequest;
  const { id, method, params } = req;

  switch (method) {
    case "initialize":
      return c.json({
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          serverInfo: {
            name: "second-brain",
            version: "1.0.0",
          },
          capabilities: {
            tools: {},
          },
          instructions: INSTRUCTIONS,
        },
      });

    case "notifications/initialized":
      return c.json({ jsonrpc: "2.0", id, result: {} });

    case "tools/list":
      return c.json({
        jsonrpc: "2.0",
        id,
        result: { tools: TOOLS },
      });

    case "tools/call": {
      const toolName = (params as { name: string })?.name;
      const toolArgs = (params as { arguments?: ToolArgs })?.arguments || {};

      try {
        const result = await handleTool(toolName, toolArgs);
        return c.json({ jsonrpc: "2.0", id, result });
      } catch (err) {
        return c.json({
          jsonrpc: "2.0",
          id,
          error: {
            code: -32000,
            message: err instanceof Error ? err.message : "Tool call failed",
          },
        });
      }
    }

    default:
      return c.json({
        jsonrpc: "2.0",
        id,
        error: { code: -32601, message: `Method not found: ${method}` },
      });
  }
});

export default mcp;
