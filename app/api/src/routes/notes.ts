import { Hono } from "hono";
import { listPages, getPage, putPage, deletePage } from "../lib/gbrain.js";
import { slugify } from "../lib/slugify.js";

const notes = new Hono();

// List notes
notes.get("/", async (c) => {
  const area = c.req.query("area") || undefined;
  const pages = await listPages({ tag: area, limit: 200 });
  return c.json(pages);
});

// Create note
notes.post("/", async (c) => {
  const { title, area, tags, content } = await c.req.json();

  if (!title || !area) {
    return c.json({ error: "Title and area are required" }, 400);
  }

  const slug = `${area}/${slugify(title)}`;
  await putPage(slug, title, area, tags || [], content || "");

  return c.json({ slug }, 201);
});

// Get single note — slug comes URL-encoded (e.g., "ai-learning%2Frag-evaluation")
notes.get("/:slug", async (c) => {
  const slug = decodeURIComponent(c.req.param("slug"));
  const page = await getPage(slug);

  if (!page) {
    return c.json({ error: "Not found" }, 404);
  }

  return c.json(page);
});

// Update note
notes.put("/:slug", async (c) => {
  const slug = decodeURIComponent(c.req.param("slug"));
  const { title, area, tags, content } = await c.req.json();

  if (!title || !area) {
    return c.json({ error: "Title and area are required" }, 400);
  }

  await putPage(slug, title, area, tags || [], content || "");
  return c.json({ slug });
});

// Delete note
notes.delete("/:slug", async (c) => {
  const slug = decodeURIComponent(c.req.param("slug"));
  await deletePage(slug);
  return c.json({ deleted: true });
});

export default notes;
