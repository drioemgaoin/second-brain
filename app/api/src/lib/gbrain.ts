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

const log = (level: "info" | "error", msg: string) => {
  const ts = new Date().toISOString().slice(11, 19);
  const fn = level === "error" ? console.error : console.log;
  fn(`${ts} [gbrain] ${msg}`);
};

function getGBrainUrl(): string {
  const url = process.env.GBRAIN_URL;
  if (!url) {
    throw new Error(
      "GBRAIN_URL is not set. Start GBrain HTTP: gbrain serve --http --port 3002 --enable-dcr"
    );
  }
  return url;
}

// -- OAuth 2.1 (Dynamic Client Registration + client_credentials) -----------

let cachedToken: { value: string; expiresAt: number } | null = null;
let cachedClientCreds: { id: string; secret: string } | null = null;

async function getAccessToken(baseUrl: string): Promise<string> {
  // Return cached token if still valid (with 30s margin)
  if (cachedToken && Date.now() < cachedToken.expiresAt - 30_000) {
    return cachedToken.value;
  }

  // Register client if needed (DCR)
  if (!cachedClientCreds) {
    log("info", "registering OAuth client via DCR");
    const regRes = await fetch(`${baseUrl}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_name: "second-brain-api",
        grant_types: ["client_credentials"],
        redirect_uris: [`http://localhost:${process.env.PORT || 3001}/callback`],
        token_endpoint_auth_method: "client_secret_post",
        scope: "admin read write",
      }),
    });
    if (!regRes.ok) {
      const body = await regRes.text().catch(() => "");
      throw new Error(
        `OAuth client registration failed (${regRes.status}). ` +
        `Make sure GBrain is started with --enable-dcr. ${body.slice(0, 200)}`
      );
    }
    const reg = (await regRes.json()) as { client_id: string; client_secret: string };
    cachedClientCreds = { id: reg.client_id, secret: reg.client_secret };
    log("info", `OAuth client registered: ${reg.client_id}`);
  }

  // Exchange for access token
  const tokenRes = await fetch(`${baseUrl}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: cachedClientCreds.id,
      client_secret: cachedClientCreds.secret,
      scope: "admin read write",
    }),
  });
  if (!tokenRes.ok) {
    // Reset client in case it expired
    cachedClientCreds = null;
    const body = await tokenRes.text().catch(() => "");
    throw new Error(`OAuth token exchange failed (${tokenRes.status}): ${body.slice(0, 200)}`);
  }

  const tok = (await tokenRes.json()) as { access_token: string; expires_in?: number };
  const expiresIn = tok.expires_in ?? 3600;
  cachedToken = { value: tok.access_token, expiresAt: Date.now() + expiresIn * 1000 };
  log("info", `OAuth token acquired (expires in ${expiresIn}s)`);
  return cachedToken.value;
}

// ---------------------------------------------------------------------------

async function parseResponse(res: Response): Promise<unknown> {
  const contentType = res.headers.get("content-type") || "";

  let json: Record<string, unknown>;

  if (contentType.includes("text/event-stream")) {
    // SSE: collect "data:" lines until we find the JSON-RPC result
    const raw = await res.text();
    const lines = raw.split("\n");
    let resultJson: Record<string, unknown> | null = null;

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6);
      if (!data || data === "[DONE]") continue;
      try {
        const parsed = JSON.parse(data) as Record<string, unknown>;
        // The final message contains "result" with the tool output
        if (parsed.result || parsed.error) {
          resultJson = parsed;
        }
      } catch {
        // skip non-JSON data lines
      }
    }

    if (!resultJson) return null;
    json = resultJson;
  } else {
    json = (await res.json()) as Record<string, unknown>;
  }

  if (json.error) {
    const err = json.error as { message?: string };
    throw new Error(`GBrain RPC error: ${err.message || JSON.stringify(json.error)}`);
  }

  const result = json?.result as Record<string, unknown> | undefined;
  if (result?.isError) {
    const content = result.content as { type: string; text: string }[] | undefined;
    const errText = content?.[0]?.text || "unknown error";
    throw new Error(`GBrain tool error: ${errText}`);
  }
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

async function mcpCall(
  toolName: string,
  args: Record<string, unknown>
): Promise<unknown> {
  const baseUrl = getGBrainUrl();
  const token = await getAccessToken(baseUrl);

  const url = `${baseUrl}/mcp`;
  const body = {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: { name: toolName, arguments: args },
  };

  log("info", `${toolName} → ${url}`);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (res.status === 401) {
    // Token expired — clear cache and retry once
    log("info", `${toolName}: token expired, refreshing`);
    cachedToken = null;
    const newToken = await getAccessToken(baseUrl);
    const retry = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        Authorization: `Bearer ${newToken}`,
      },
      body: JSON.stringify(body),
    });
    if (!retry.ok) {
      const snippet = (await retry.text().catch(() => "")).slice(0, 200);
      log("error", `${toolName} failed after token refresh: HTTP ${retry.status} — ${snippet}`);
      throw new Error(`GBrain ${toolName} failed (${retry.status})`);
    }
    return parseResponse(retry);
  }

  if (!res.ok) {
    const snippet = (await res.text().catch(() => "")).slice(0, 200);
    log("error", `${toolName} failed: HTTP ${res.status} — ${snippet}`);
    throw new Error(`GBrain ${toolName} failed (${res.status})`);
  }

  return parseResponse(res);
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
        content: String(item.chunk_text || item.content || item.text || item.chunk || ""),
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
      const frontmatter = (page.frontmatter || {}) as Record<string, unknown>;

      // GBrain stores rendered content in compiled_truth, raw in content
      const rawContent = String(page.compiled_truth || page.content || page.markdown || "");
      const parsed = parseFrontmatter(rawContent);

      // Area: frontmatter > parsed > slug prefix
      const pageArea = String(frontmatter.area || page.area || parsed.area || extractArea(String(page.slug || slug)));
      // Tags: page-level > parsed
      const pageTags = Array.isArray(page.tags) ? page.tags.map(String) : parsed.tags;
      // Title: page-level > parsed from markdown
      const pageTitle = String(page.title || parsed.title || "");
      // Content: strip frontmatter and title heading
      const body = parsed.body.replace(/^#\s+.+\n*/, "").trim();

      return {
        slug: String(page.slug || slug),
        title: pageTitle,
        area: pageArea,
        tags: pageTags,
        content: body,
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
