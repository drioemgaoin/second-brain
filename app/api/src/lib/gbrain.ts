// ---------------------------------------------------------------------------
// GBrain client — HTTP MCP only (no CLI, avoids PGLite lock conflicts)
//
// Requires GBRAIN_URL env var pointing to `gbrain serve --http`.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GBrainChunk {
  slug: string;
  title: string;
  content: string;
  score: number;
}

export interface GBrainPage {
  slug: string;
  title: string;
  area: string;
  tags: string[];
  content: string;
}

export interface GBrainListItem {
  slug: string;
  title: string;
  area: string;
  updatedAt?: string;
}

// ---------------------------------------------------------------------------
// MCP transport
// ---------------------------------------------------------------------------

function getGBrainUrl(): string {
  const url = process.env.GBRAIN_URL;
  if (!url) {
    throw new Error(
      "GBRAIN_URL is not set. Start GBrain HTTP: gbrain serve --http --port 3002"
    );
  }
  return url;
}

async function mcpCall(
  toolName: string,
  args: Record<string, unknown>
): Promise<unknown> {
  const baseUrl = getGBrainUrl();

  const res = await fetch(`${baseUrl}/mcp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: { name: toolName, arguments: args },
    }),
  });

  if (!res.ok) {
    throw new Error(`GBrain HTTP ${toolName} failed (${res.status})`);
  }

  const json = (await res.json()) as Record<string, unknown>;
  const result = json?.result as Record<string, unknown> | undefined;
  const content = result?.content;
  if (!Array.isArray(content)) return null;

  const text = content
    .filter((c: { type: string }) => c.type === "text")
    .map((c: { text: string }) => c.text)
    .join("\n");

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// ---------------------------------------------------------------------------
// Query
// ---------------------------------------------------------------------------

export async function queryBrain(
  question: string,
  limit = 8
): Promise<GBrainChunk[]> {
  try {
    const result = await mcpCall("query", {
      query: question,
      limit,
      adaptive_return: true,
    });

    if (typeof result === "string") {
      return parseTextOutput(result);
    }

    if (Array.isArray(result)) {
      return result.map((item: Record<string, unknown>) => ({
        slug: String(item.slug || item.page_slug || ""),
        title: String(item.title || item.slug || ""),
        content: String(item.content || item.text || item.chunk || ""),
        score: Number(item.score || item.rank_score || 0),
      }));
    }

    return [];
  } catch (err) {
    console.error("GBrain query failed:", err);
    return [];
  }
}

function parseTextOutput(output: string): GBrainChunk[] {
  const chunks: GBrainChunk[] = [];

  const sections = output.split(/(?=^## )/m);
  for (const section of sections) {
    const headerMatch = section.match(
      /^## (.+?)(?:\s+\(score:\s*([\d.]+)\))?\s*\n/
    );
    if (headerMatch) {
      const slug = headerMatch[1].trim();
      const score = headerMatch[2] ? parseFloat(headerMatch[2]) : 0;
      const content = section.slice(headerMatch[0].length).trim();
      chunks.push({
        slug,
        title: slug.split("/").pop() || slug,
        content,
        score,
      });
    }
  }

  if (chunks.length === 0 && output.trim()) {
    chunks.push({
      slug: "brain",
      title: "Knowledge Base",
      content: output.trim(),
      score: 1,
    });
  }

  return chunks;
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

function parseFrontmatter(raw: string): {
  area: string;
  tags: string[];
  title: string;
  body: string;
} {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!match) {
    const titleMatch = raw.match(/^#\s+(.+)/m);
    return {
      area: "",
      tags: [],
      title: titleMatch?.[1]?.trim() || "",
      body: raw,
    };
  }

  const frontmatter = match[1];
  const body = match[2];

  const areaMatch = frontmatter.match(/^area:\s*(.+)$/m);
  const tagsMatch = frontmatter.match(/^tags:\s*\[([^\]]*)\]$/m);
  const titleMatch = body.match(/^#\s+(.+)/m);

  return {
    area: areaMatch?.[1]?.trim() || "",
    tags: tagsMatch
      ? tagsMatch[1]
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [],
    title: titleMatch?.[1]?.trim() || "",
    body,
  };
}

function buildMarkdown(
  title: string,
  area: string,
  tags: string[],
  content: string
): string {
  const tagList = tags.length > 0 ? tags.join(", ") : area;
  return `---
area: ${area}
tags: [${tagList}]
---

# ${title}

${content}`;
}

function extractArea(slug: string): string {
  const parts = slug.split("/");
  return parts.length > 1 ? parts[0] : "";
}

export async function listPages(options?: {
  tag?: string;
  limit?: number;
}): Promise<GBrainListItem[]> {
  const limit = options?.limit ?? 100;
  const tag = options?.tag;

  try {
    const result = await mcpCall("list_pages", {
      ...(tag ? { tag } : {}),
      limit,
      sort: "updated_desc",
    });

    if (result && Array.isArray(result)) {
      return result.map((item: Record<string, unknown>) => ({
        slug: String(item.slug || ""),
        title: String(item.title || item.slug || ""),
        area: String(item.area || extractArea(String(item.slug || ""))),
        updatedAt: item.updated_at ? String(item.updated_at) : undefined,
      }));
    }

    return [];
  } catch (err) {
    console.error("GBrain list failed:", err);
    return [];
  }
}

export async function getPage(slug: string): Promise<GBrainPage | null> {
  try {
    const result = await mcpCall("get_page", { slug });

    if (result && typeof result === "object") {
      const page = result as Record<string, unknown>;
      const rawContent = String(page.content || page.markdown || "");
      const parsed = parseFrontmatter(rawContent);
      return {
        slug: String(page.slug || slug),
        title: String(page.title || parsed.title),
        area: String(page.area || parsed.area),
        tags: Array.isArray(page.tags) ? page.tags.map(String) : parsed.tags,
        content: parsed.body.replace(/^#\s+.+\n*/, "").trim(),
      };
    }

    return null;
  } catch (err) {
    console.error("GBrain get failed:", err);
    return null;
  }
}

export async function putPage(
  slug: string,
  title: string,
  area: string,
  tags: string[],
  content: string
): Promise<void> {
  const markdown = buildMarkdown(title, area, tags, content);

  await mcpCall("put_page", { slug, content: markdown });
}

export async function deletePage(slug: string): Promise<void> {
  await mcpCall("delete_page", { slug });
}
