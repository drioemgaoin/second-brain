// ---------------------------------------------------------------------------
// MCP server endpoint — exposes second-brain API as MCP tools for Claude Code
//
// Claude Code connects here (http://localhost:3001/mcp) instead of hitting
// GBrain directly. This keeps the API as the single entry point.
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

// -- Tool definitions --------------------------------------------------------

const TOOLS = [
  {
    name: "search_notes",
    description:
      "Search notes in the second brain using semantic + keyword search. " +
      "Returns the most relevant chunks with their slug, title, content, and score.",
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
      "List all notes, optionally filtered by area (e.g. ai-learning, hiring, quantum-physics, others).",
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
      "Get the full content of a single note by its slug (e.g. ai-learning/rag-evaluation).",
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
    description: "Create a new note in the second brain.",
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
          description: "Tags for the note",
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
    description: "Update an existing note by slug.",
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
    description: "Delete a note by slug (soft delete, recoverable for 72h).",
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
