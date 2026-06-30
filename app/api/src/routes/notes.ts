import { Hono } from "hono";
import { listPages, getPage, putPage, deletePage } from "../lib/gbrain.js";
import { slugify } from "../lib/slugify.js";

const notes = new Hono();

// -- Validation helpers ------------------------------------------------------

function trimString(val: unknown): string {
  return typeof val === "string" ? val.trim() : "";
}

function parseTags(val: unknown): string[] {
  if (!Array.isArray(val)) return [];
  return val
    .map((t) => (typeof t === "string" ? t.trim().toLowerCase() : ""))
    .filter((t) => t.length > 0 && t.length <= 50);
}

function validateNote(body: Record<string, unknown>): {
  ok: boolean;
  error?: string;
  data?: { title: string; area: string; tags: string[]; content: string };
} {
  const title = trimString(body.title);
  const area = trimString(body.area);
  const tags = parseTags(body.tags);
  const content = trimString(body.content);

  if (!title) return { ok: false, error: "Title is required" };
  if (title.length > 200)
    return { ok: false, error: "Title must be 200 characters or less" };
  if (!area) return { ok: false, error: "Area is required" };
  if (area.length > 50)
    return { ok: false, error: "Area must be 50 characters or less" };
  if (!content) return { ok: false, error: "Content is required" };

  // Ensure area is included as a tag
  if (!tags.includes(area)) {
    tags.unshift(area);
  }

  return { ok: true, data: { title, area, tags, content } };
}

// -- Helpers -----------------------------------------------------------------

function backendError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("ECONNREFUSED") || msg.includes("fetch failed"))
    return "The server could not reach its data store. Please try again in a moment.";
  if (msg.includes("404"))
    return "The server could not reach its data store. Please try again in a moment.";
  return "Something went wrong on the server. Please try again later.";
}

// -- Routes ------------------------------------------------------------------

// List notes
notes.get("/", async (c) => {
  try {
    const area = c.req.query("area") || undefined;
    const pages = await listPages({ tag: area, limit: 200 });
    return c.json(pages);
  } catch (err) {
    console.error("List notes failed:", err);
    return c.json({ error: backendError(err) }, 502);
  }
});

// Create note
notes.post("/", async (c) => {
  const body = await c.req.json();
  const result = validateNote(body);

  if (!result.ok) {
    return c.json({ error: result.error }, 400);
  }

  try {
    const { title, area, tags, content } = result.data!;
    const slug = `${area}/${slugify(title)}`;
    await putPage(slug, title, area, tags, content);
    return c.json({ slug }, 201);
  } catch (err) {
    console.error("Create note failed:", err);
    return c.json({ error: backendError(err) }, 502);
  }
});

// Get single note
notes.get("/:slug", async (c) => {
  try {
    const slug = decodeURIComponent(c.req.param("slug"));
    const page = await getPage(slug);

    if (!page) {
      return c.json({ error: "Not found" }, 404);
    }

    return c.json(page);
  } catch (err) {
    console.error("Get note failed:", err);
    return c.json({ error: backendError(err) }, 502);
  }
});

// Update note
notes.put("/:slug", async (c) => {
  const slug = decodeURIComponent(c.req.param("slug"));
  const body = await c.req.json();
  const result = validateNote(body);

  if (!result.ok) {
    return c.json({ error: result.error }, 400);
  }

  try {
    const { title, area, tags, content } = result.data!;
    await putPage(slug, title, area, tags, content);
    return c.json({ slug });
  } catch (err) {
    console.error("Update note failed:", err);
    return c.json({ error: backendError(err) }, 502);
  }
});

// Delete note
notes.delete("/:slug", async (c) => {
  try {
    const slug = decodeURIComponent(c.req.param("slug"));
    await deletePage(slug);
    return c.json({ deleted: true });
  } catch (err) {
    console.error("Delete note failed:", err);
    return c.json({ error: backendError(err) }, 502);
  }
});

export default notes;
